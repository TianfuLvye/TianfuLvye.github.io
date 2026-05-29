import * as THREE from 'three';
import type { BridgePlacement } from './place-bridges';
import { rngFor, rangeFrom } from './random';
import type { TagBridge } from './types';
import { colorForTag } from './tag-bridges';

export const BASE_Y = 0.06;
export const Y_LIFT = [0, 0.02, 0.04] as const;

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

export function bridgeCurveFromWaypoints(
  waypoints: THREE.Vector3[],
): THREE.Curve<THREE.Vector3> {
  if (waypoints.length < 2) {
    const p = waypoints[0] ?? new THREE.Vector3(0, BASE_Y, 0);
    return new THREE.LineCurve3(p, p.clone());
  }
  if (waypoints.length === 2) {
    return new THREE.LineCurve3(waypoints[0], waypoints[1]);
  }

  // Grid paths are orthogonal polylines; CatmullRom breaks on collinear points.
  const path = new THREE.CurvePath<THREE.Vector3>();
  for (let i = 0; i < waypoints.length - 1; i++) {
    path.add(new THREE.LineCurve3(waypoints[i], waypoints[i + 1]));
  }
  return path;
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

function tangentAlongSpacedPoints(
  points: THREE.Vector3[],
  index: number,
): THREE.Vector3 {
  if (points.length === 1) return new THREE.Vector3(0, 0, 1);
  if (index === 0) {
    return points[1].clone().sub(points[0]).normalize();
  }
  if (index === points.length - 1) {
    return points[index].clone().sub(points[index - 1]).normalize();
  }
  const fwd = points[index + 1].clone().sub(points[index]);
  const back = points[index].clone().sub(points[index - 1]);
  const avg = fwd.add(back);
  if (avg.lengthSq() < 1e-8) return fwd.normalize();
  return avg.normalize();
}

function sampleCurveFrames(
  curve: THREE.Curve<THREE.Vector3>,
  count: number,
): Array<{ point: THREE.Vector3; tangent: THREE.Vector3 }> {
  const spaced = curve.getSpacedPoints(count);
  return spaced.map((point, i) => ({
    point,
    tangent: tangentAlongSpacedPoints(spaced, i),
  }));
}

export function buildBridgeMeshSpec(
  bridge: TagBridge,
  placement: BridgePlacement,
): BridgeMeshSpec {
  const seed = `${bridge.sourceId}:${bridge.targetId}`;
  const rng = rngFor(`bridge:${seed}`);
  const curve = bridgeCurveFromWaypoints(placement.waypoints);
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
  const leftPts = stringerPoints.map((p, i) =>
    offsetPoint(p, tangentAlongSpacedPoints(stringerPoints, i), -stringerOffset),
  );
  const rightPts = stringerPoints.map((p, i) =>
    offsetPoint(p, tangentAlongSpacedPoints(stringerPoints, i), stringerOffset),
  );

  const stringerColor = colorForTag(bridge.tags[0]);

  const stringers: StringerSpec[] = [
    { points: leftPts, color: stringerColor },
    { points: rightPts, color: stringerColor },
  ];

  const curveLen = curve.getLength();
  const pilingCount = Math.max(2, Math.floor(curveLen / 2.5) + 1);
  const pilingHeight = 0.11 + yLift;
  const pilingPoints = curve.getSpacedPoints(pilingCount);
  const pilings: PilingSpec[] = [];
  for (let i = 0; i < pilingCount; i++) {
    const point = pilingPoints[i];
    const tangent = tangentAlongSpacedPoints(pilingPoints, i);
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
  curve: THREE.Curve<THREE.Vector3>,
  deckY: number,
  halfWidth: number,
  plankCount: number,
): THREE.BufferGeometry {
  const segments = Math.max(plankCount * 3, 16);
  const centerPoints = curve.getSpacedPoints(segments + 1);
  const verts: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < centerPoints.length; i++) {
    const p = centerPoints[i];
    const tangent = tangentAlongSpacedPoints(centerPoints, i);
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

  for (let i = 0; i < centerPoints.length - 1; i++) {
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

export { WOOD_DARK };
