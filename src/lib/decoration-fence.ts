import {
  DECOR_FENCE_HALF_LENGTH,
  DECOR_FENCE_INSET,
  DECOR_FENCE_SEGMENT_SPACING,
} from './map-config';
import { rangeFrom } from './random';

export type FenceMode = 'squareMissingSide' | 'arcWithGap';

export interface FenceSegmentPlacement {
  decorId: string;
  position: [number, number, number];
  rotation: number;
  scale: number;
}

function localToWorld(
  bx: number,
  bz: number,
  rotation: number,
  lx: number,
  lz: number,
): [number, number] {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return [bx + lx * cos + lz * sin, bz + -lx * sin + lz * cos];
}

function alignFenceRotation(worldDx: number, worldDz: number): number {
  // Fence GLB long axis is local +X; rotate so +X aligns with path tangent.
  return Math.atan2(-worldDz, worldDx);
}

function pushFenceSegment(
  out: FenceSegmentPlacement[],
  x: number,
  z: number,
  rotation: number,
) {
  out.push({
    decorId: 'fence',
    position: [x, 0, z],
    rotation,
    scale: 1,
  });
}

function layoutSquareFence(
  bx: number,
  bz: number,
  rotation: number,
  halfSize: number,
  gapSide: number,
  spacing: number,
): FenceSegmentPlacement[] {
  const out: FenceSegmentPlacement[] = [];
  const sides: Array<{
    x0: number;
    z0: number;
    x1: number;
    z1: number;
  }> = [
    { x0: -halfSize, z0: -halfSize, x1: halfSize, z1: -halfSize },
    { x0: halfSize, z0: -halfSize, x1: halfSize, z1: halfSize },
    { x0: halfSize, z0: halfSize, x1: -halfSize, z1: halfSize },
    { x0: -halfSize, z0: halfSize, x1: -halfSize, z1: -halfSize },
  ];

  const prevSide = (s: number) => (s + 3) % 4;
  const nextSide = (s: number) => (s + 1) % 4;
  const halfLen = DECOR_FENCE_HALF_LENGTH;

  for (let s = 0; s < 4; s++) {
    if (s === gapSide) continue;
    const side = sides[s];
    const dx = side.x1 - side.x0;
    const dz = side.z1 - side.z0;
    const len = Math.hypot(dx, dz);
    if (len <= halfLen * 2) continue;

    const startShared = prevSide(s) !== gapSide;
    const endShared = nextSide(s) !== gapSide;
    const startInset = startShared ? halfLen : halfLen * 0.35;
    const endInset = endShared ? halfLen : halfLen * 0.35;
    const tStart = startInset / len;
    const tEnd = 1 - endInset / len;
    if (tEnd <= tStart) continue;

    const innerLen = len * (tEnd - tStart);
    const steps = Math.max(1, Math.floor(innerLen / spacing));
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const worldDx = dx * cos + dz * sin;
    const worldDz = -dx * sin + dz * cos;
    const tangentRot = alignFenceRotation(worldDx, worldDz);

    for (let i = 0; i < steps; i++) {
      const t = tStart + ((i + 0.5) / steps) * (tEnd - tStart);
      const lx = side.x0 + dx * t;
      const lz = side.z0 + dz * t;
      const [wx, wz] = localToWorld(bx, bz, rotation, lx, lz);
      pushFenceSegment(out, wx, wz, tangentRot);
    }
  }

  return out;
}

function layoutArcFence(
  bx: number,
  bz: number,
  radius: number,
  gapStart: number,
  spacing: number,
): FenceSegmentPlacement[] {
  const out: FenceSegmentPlacement[] = [];
  const arcSpan = Math.PI * 1.5;
  const circumference = radius * arcSpan;
  const steps = Math.max(3, Math.floor(circumference / spacing));
  const stepAngle = arcSpan / steps;

  for (let i = 0; i <= steps; i++) {
    const angle = gapStart + i * stepAngle;
    const x = bx + Math.sin(angle) * radius;
    const z = bz + Math.cos(angle) * radius;
    const worldDx = Math.cos(angle);
    const worldDz = -Math.sin(angle);
    const tangentRot = alignFenceRotation(worldDx, worldDz);
    pushFenceSegment(out, x, z, tangentRot);
  }

  return out;
}

export function layoutFenceAroundBuilding(
  bx: number,
  bz: number,
  buildingRotation: number,
  buildingRadius: number,
  rng: () => number,
): FenceSegmentPlacement[] {
  const offset = buildingRadius + DECOR_FENCE_INSET;
  const spacing = DECOR_FENCE_SEGMENT_SPACING;
  const mode: FenceMode =
    rng() < 0.5 ? 'squareMissingSide' : 'arcWithGap';

  if (mode === 'squareMissingSide') {
    const gapSide = Math.floor(rng() * 4);
    return layoutSquareFence(
      bx,
      bz,
      buildingRotation,
      offset,
      gapSide,
      spacing,
    );
  }

  const gapStart = rangeFrom(rng, 0, Math.PI * 2);
  return layoutArcFence(bx, bz, offset, gapStart, spacing);
}
