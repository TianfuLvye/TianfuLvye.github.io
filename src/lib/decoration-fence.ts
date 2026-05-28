import {
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

function worldTangentRotation(
  rotation: number,
  localDx: number,
  localDz: number,
): number {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const worldDx = localDx * cos + localDz * sin;
  const worldDz = -localDx * sin + localDz * cos;
  return Math.atan2(worldDx, worldDz);
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

  for (let s = 0; s < 4; s++) {
    if (s === gapSide) continue;
    const side = sides[s];
    const dx = side.x1 - side.x0;
    const dz = side.z1 - side.z0;
    const len = Math.hypot(dx, dz);
    const steps = Math.max(1, Math.floor(len / spacing));
    const tangentRot = worldTangentRotation(rotation, dx, dz);

    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0.5 : i / steps;
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
    const tangentRot = angle + Math.PI / 2;
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
