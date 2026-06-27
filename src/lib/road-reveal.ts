import { cellKey, parseCellKey, type GridCell } from './grid';
import { NEIGHBOR4_OFFSETS } from './direction';

export const STAGGER_S = 0.045;
export const APPEAR_DURATION_S = 0.55;
export const HIDE_DURATION_S = 0.35;
export const HIDE_DEPTH = 0.15;

/** Robert Penner easeOutBack — overshoots 1 before settling at 1. */
export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/** Graph center: cell with minimum eccentricity on the path network. */
export function pickRoadRevealSeed(pathSet: Set<string>): GridCell {
  if (pathSet.size === 0) return { col: 0, row: 0 };
  if (pathSet.size === 1) return parseCellKey([...pathSet][0]);

  let bestKey = [...pathSet][0];
  let bestEcc = Infinity;

  for (const key of pathSet) {
    const distances = computeRoadRevealDistances(pathSet, parseCellKey(key));
    let ecc = 0;
    for (const d of distances.values()) {
      if (d > ecc) ecc = d;
    }
    if (ecc < bestEcc) {
      bestEcc = ecc;
      bestKey = key;
    }
  }

  return parseCellKey(bestKey);
}

/** BFS hop distances from seed within pathSet (4-connected). */
export function computeRoadRevealDistances(
  pathSet: Set<string>,
  seed: GridCell,
): Map<string, number> {
  const distances = new Map<string, number>();
  const seedKey = cellKey(seed.col, seed.row);
  if (!pathSet.has(seedKey)) return distances;

  const queue: string[] = [seedKey];
  distances.set(seedKey, 0);

  let head = 0;
  while (head < queue.length) {
    const key = queue[head++];
    const { col, row } = parseCellKey(key);
    const dist = distances.get(key)!;

    for (const { dc, dr } of NEIGHBOR4_OFFSETS) {
      const nk = cellKey(col + dc, row + dr);
      if (!pathSet.has(nk) || distances.has(nk)) continue;
      distances.set(nk, dist + 1);
      queue.push(nk);
    }
  }

  return distances;
}

/** 4-connected components within a tag path set. */
export function partitionPathSetComponents(pathSet: Set<string>): Set<string>[] {
  const remaining = new Set(pathSet);
  const components: Set<string>[] = [];

  while (remaining.size > 0) {
    const startKey = remaining.values().next().value!;
    const component = new Set<string>();
    const queue = [startKey];
    remaining.delete(startKey);
    component.add(startKey);

    let head = 0;
    while (head < queue.length) {
      const key = queue[head++];
      const { col, row } = parseCellKey(key);
      for (const { dc, dr } of NEIGHBOR4_OFFSETS) {
        const nk = cellKey(col + dc, row + dr);
        if (!remaining.has(nk)) continue;
        remaining.delete(nk);
        component.add(nk);
        queue.push(nk);
      }
    }
    components.push(component);
  }

  return components;
}

/**
 * BFS distances for every cell in pathSet.
 * Each disconnected road segment gets its own center-seed wave.
 */
export function computeRoadRevealDistancesForPathSet(
  pathSet: Set<string>,
): Map<string, number> {
  const distances = new Map<string, number>();
  for (const component of partitionPathSetComponents(pathSet)) {
    const seed = pickRoadRevealSeed(component);
    const componentDist = computeRoadRevealDistances(component, seed);
    for (const [key, dist] of componentDist) {
      distances.set(key, dist);
    }
  }
  return distances;
}

/** Appear / upgrade bump: underground → overshoot → settle at ground. */
export function roadAppearYOffset(progress: number, hideDepth = HIDE_DEPTH): number {
  const t = Math.max(0, Math.min(1, progress));
  return -hideDepth + hideDepth * easeOutBack(t);
}

/** Upgrade from ground: overshoot above 0 then settle (no underground start). */
export function roadUpgradeYOffset(progress: number, amplitude = HIDE_DEPTH): number {
  const t = Math.max(0, Math.min(1, progress));
  return amplitude * (easeOutBack(t) - t);
}

/** Hide: linear sink, no bounce. */
export function roadHideYOffset(progress: number, depth = HIDE_DEPTH): number {
  const t = Math.max(0, Math.min(1, progress));
  return -depth * t;
}

export function revealStartMs(
  startedAtMs: number,
  distance: number,
  staggerS = STAGGER_S,
): number {
  return startedAtMs + distance * staggerS * 1000;
}

export function hideStartMs(
  startedAtMs: number,
  distance: number,
  maxDistance: number,
  staggerS = STAGGER_S,
): number {
  return startedAtMs + (maxDistance - distance) * staggerS * 1000;
}
