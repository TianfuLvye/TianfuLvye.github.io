import * as THREE from 'three';
import { buildingRadius, type BuildingPlacement } from './layout';
import { rngFor, rangeFrom } from './random';
import type { TagBridge } from './types';
import { colorForTag } from './tag-bridges';

export const BASE_Y = 0.06;
export const Y_LIFT = [0, 0.02, 0.04] as const;

/** Extra gap between bridge end and building footprint edge. */
export const BRIDGE_BUILDING_CLEARANCE = 0.3;

/** Across the bridge deck (local X). */
export const PLANK_SPAN = 0.54;
/** Along the path, one board in the chain (local Z). */
export const PLANK_RUN = 0.24;
export const PLANK_THICK = 0.042;
export const PLANK_PITCH = 0.36;
export const MIN_PLANKS = 3;

/** 红橙黄绿青蓝紫 — for rainbow bridges only. */
export const RAINBOW_COLORS = [
  '#d32f2f',
  '#f57c00',
  '#fbc02d',
  '#388e3c',
  '#0097a7',
  '#1976d2',
  '#7b1fa2',
] as const;

const WOOD_DARK = '#6b4a2a';
const BRIDGE_CORRIDOR_RADIUS = 0.95;

export function bridgeEndpointClearance(radius: number): number {
  return radius + BRIDGE_BUILDING_CLEARANCE;
}

export function insetBridgeEndpoints(
  startCenter: Readonly<[number, number, number]>,
  endCenter: Readonly<[number, number, number]>,
  startClearance: number,
  endClearance: number,
): { start: THREE.Vector3; end: THREE.Vector3 } {
  const startCenter3 = new THREE.Vector3(startCenter[0], BASE_Y, startCenter[2]);
  const endCenter3 = new THREE.Vector3(endCenter[0], BASE_Y, endCenter[2]);
  const dx = endCenter3.x - startCenter3.x;
  const dz = endCenter3.z - startCenter3.z;
  const len = Math.hypot(dx, dz);
  const totalInset = startClearance + endClearance;

  if (len <= totalInset) {
    const mid = startCenter3.clone().add(endCenter3).multiplyScalar(0.5);
    mid.y = BASE_Y;
    return { start: mid, end: mid.clone() };
  }

  const nx = dx / len;
  const nz = dz / len;
  return {
    start: new THREE.Vector3(
      startCenter3.x + nx * startClearance,
      BASE_Y,
      startCenter3.z + nz * startClearance,
    ),
    end: new THREE.Vector3(
      endCenter3.x - nx * endClearance,
      BASE_Y,
      endCenter3.z - nz * endClearance,
    ),
  };
}

export function bridgeEndpointsForBuildings(
  a: BuildingPlacement,
  b: BuildingPlacement,
): { start: THREE.Vector3; end: THREE.Vector3 } {
  return insetBridgeEndpoints(
    a.position,
    b.position,
    bridgeEndpointClearance(buildingRadius(a)),
    bridgeEndpointClearance(buildingRadius(b)),
  );
}

export function bridgeCurve(
  start: THREE.Vector3,
  end: THREE.Vector3,
  seed: string,
): THREE.QuadraticBezierCurve3 {
  const rng = rngFor(`curve:${seed}`);
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const len = Math.hypot(dx, dz) || 1;
  const nx = -dz / len;
  const nz = dx / len;
  const bulge = 0.15 + rng() * 0.25;
  mid.y = BASE_Y + 0.04;
  mid.x += nx * bulge;
  mid.z += nz * bulge;
  return new THREE.QuadraticBezierCurve3(start, mid, end);
}

export function computePlankCount(curve: THREE.Curve<THREE.Vector3>): number {
  return Math.max(MIN_PLANKS, Math.floor(curve.getLength() / PLANK_PITCH));
}

export function plankColor(bridge: TagBridge, index: number): string {
  const { kind, tags } = bridge;
  if (kind === 'rainbow') {
    return RAINBOW_COLORS[index % RAINBOW_COLORS.length];
  }
  if (kind === 'single') return colorForTag(tags[0]);
  return index % 2 === 0 ? colorForTag(tags[0]) : colorForTag(tags[1]);
}

/** Thin elongated plank: wide across the deck, short along the path. */
export function buildPlankGeometry(seed: string): THREE.BufferGeometry {
  const rng = rngFor(`plank-shape:${seed}`);
  const span = PLANK_SPAN * (1 + rangeFrom(rng, -0.04, 0.04));
  const run = PLANK_RUN * (1 + rangeFrom(rng, -0.06, 0.06));
  const geo = new THREE.BoxGeometry(span, PLANK_THICK, run);

  if (rng() > 0.65) {
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const corner = Math.floor(rng() * 4);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const isTop = pos.getY(i) > 0;
      if (!isTop) continue;
      const nearCorner =
        (corner === 0 && x > 0 && z > 0) ||
        (corner === 1 && x < 0 && z > 0) ||
        (corner === 2 && x < 0 && z < 0) ||
        (corner === 3 && x > 0 && z < 0);
      if (nearCorner) {
        pos.setX(i, x * (0.55 + rng() * 0.15));
        pos.setZ(i, z * (0.55 + rng() * 0.15));
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }

  return geo;
}

export interface PlankSpec {
  position: THREE.Vector3;
  rotation: [number, number, number];
  color: string;
  geometrySeed: string;
}

export interface StringerSpec {
  points: THREE.Vector3[];
  color: string;
}

export interface PilingSpec {
  position: [number, number, number];
  height: number;
}

export interface BridgeMeshSpec {
  planks: PlankSpec[];
  stringers: StringerSpec[];
  pilings: PilingSpec[];
  renderOrder: number;
  yLift: number;
  /** Invisible ribbon between stringers for pointer hit-testing. */
  deckHitGeometry: THREE.BufferGeometry;
}

/** Lateral offset of side stringers from bridge centerline. */
export const STRINGER_LATERAL_OFFSET = PLANK_SPAN * 0.45;

function offsetPoint(
  point: THREE.Vector3,
  tangent: THREE.Vector3,
  lateral: number,
): THREE.Vector3 {
  const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
  return point.clone().addScaledVector(side, lateral);
}

function sampleCurveFrames(
  curve: THREE.QuadraticBezierCurve3,
  count: number,
): Array<{ point: THREE.Vector3; tangent: THREE.Vector3 }> {
  const spaced = curve.getSpacedPoints(count);
  return spaced.map((point, i) => {
    const t = i / Math.max(count - 1, 1);
    const tangent = curve.getTangentAt(t).normalize();
    return { point, tangent };
  });
}

export function buildBridgeMeshSpec(
  bridge: TagBridge,
  start: THREE.Vector3,
  end: THREE.Vector3,
): BridgeMeshSpec {
  const seed = `${bridge.sourceId}:${bridge.targetId}`;
  const rng = rngFor(`bridge:${seed}`);
  const curve = bridgeCurve(start, end, seed);
  const plankCount = computePlankCount(curve);
  const yLift = Y_LIFT[bridge.priority - 1];
  const renderOrder = bridge.priority;
  const frames = sampleCurveFrames(curve, plankCount);

  const planks: PlankSpec[] = frames.map(({ point, tangent }, i) => {
    const yaw = Math.atan2(tangent.x, tangent.z);
    return {
      position: new THREE.Vector3(
        point.x,
        point.y + yLift + 0.05,
        point.z,
      ),
      rotation: [
        rangeFrom(rng, -0.02, 0.02),
        yaw + rangeFrom(rng, -0.03, 0.03),
        rangeFrom(rng, -0.025, 0.025),
      ],
      color: plankColor(bridge, i),
      geometrySeed: `${seed}:${i}`,
    };
  });

  const stringerOffset = STRINGER_LATERAL_OFFSET;
  const stringerPoints = curve.getSpacedPoints(Math.max(8, plankCount));
  const leftPts = stringerPoints.map((p, i) => {
    const t = i / Math.max(stringerPoints.length - 1, 1);
    const tangent = curve.getTangentAt(t).normalize();
    return offsetPoint(p, tangent, -stringerOffset);
  });
  const rightPts = stringerPoints.map((p, i) => {
    const t = i / Math.max(stringerPoints.length - 1, 1);
    const tangent = curve.getTangentAt(t).normalize();
    return offsetPoint(p, tangent, stringerOffset);
  });

  const stringerColor = colorForTag(bridge.tags[0]);

  const stringers: StringerSpec[] = [
    { points: leftPts, color: stringerColor },
    { points: rightPts, color: stringerColor },
  ];

  const curveLen = curve.getLength();
  const pilingCount = Math.max(2, Math.floor(curveLen / 2.5) + 1);
  const pilingHeight = 0.11 + yLift;
  const pilings: PilingSpec[] = [];
  for (let i = 0; i < pilingCount; i++) {
    const t = i / (pilingCount - 1);
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    for (const lateral of [-stringerOffset, stringerOffset]) {
      const p = offsetPoint(point, tangent, lateral);
      pilings.push({
        position: [p.x, BASE_Y + 0.01, p.z],
        height: pilingHeight,
      });
    }
  }

  const deckY = BASE_Y + yLift + 0.05;
  const deckHitGeometry = buildBridgeDeckHitGeometry(
    curve,
    deckY,
    stringerOffset,
    plankCount,
  );

  return {
    planks,
    stringers,
    pilings,
    renderOrder,
    yLift,
    deckHitGeometry,
  };
}

/** Ribbon mesh between the two stringers for stable bridge-level hover. */
export function buildBridgeDeckHitGeometry(
  curve: THREE.QuadraticBezierCurve3,
  deckY: number,
  halfWidth: number,
  plankCount: number,
): THREE.BufferGeometry {
  const segments = Math.max(plankCount * 3, 16);
  const verts: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x);
    const left = p
      .clone()
      .setY(deckY)
      .addScaledVector(side, -halfWidth);
    const right = p
      .clone()
      .setY(deckY)
      .addScaledVector(side, halfWidth);
    verts.push(left.x, left.y, left.z, right.x, right.y, right.z);
  }

  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, b, c, b, d, c);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function pickPlankIndexAtPoint(
  planks: PlankSpec[],
  point: THREE.Vector3,
): number {
  let best = 0;
  let bestDistSq = Infinity;
  for (let i = 0; i < planks.length; i++) {
    const dx = planks[i].position.x - point.x;
    const dz = planks[i].position.z - point.z;
    const distSq = dx * dx + dz * dz;
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      best = i;
    }
  }
  return best;
}

/** Sample xz points along all bridge curves for decor exclusion. */
export function sampleBridgeCorridor(
  bridges: TagBridge[],
  buildings: BuildingPlacement[],
): Array<[number, number]> {
  const byId = new Map(buildings.map((b) => [b.note.id, b]));
  const points: Array<[number, number]> = [];

  for (const bridge of bridges) {
    const a = byId.get(bridge.sourceId);
    const b = byId.get(bridge.targetId);
    if (!a || !b) continue;

    const { start, end } = bridgeEndpointsForBuildings(a, b);
    const seed = `${bridge.sourceId}:${bridge.targetId}`;
    const curve = bridgeCurve(start, end, seed);
    const steps = Math.max(10, Math.ceil(curve.getLength() / 0.35));
    for (const p of curve.getSpacedPoints(steps)) {
      points.push([p.x, p.z]);
    }
  }

  return points;
}

export function isNearBridgeCorridor(
  x: number,
  z: number,
  corridor: Array<[number, number]>,
  radius = BRIDGE_CORRIDOR_RADIUS,
): boolean {
  const r2 = radius * radius;
  for (const [bx, bz] of corridor) {
    const dx = x - bx;
    const dz = z - bz;
    if (dx * dx + dz * dz < r2) return true;
  }
  return false;
}

export { WOOD_DARK, BRIDGE_CORRIDOR_RADIUS };
