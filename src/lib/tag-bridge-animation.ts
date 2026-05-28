import * as THREE from 'three';
import type { TagBridge } from './types';
import { BASE_Y, bridgeCurve, computePlankCount } from './plank-bridge';

export const RISE_DURATION_MS = 460;
export const SINK_DURATION_MS = 350;
export const SINK_DEPTH = 0.36;
export const PLANK_STAGGER_MS = 45;

export type TagBridgeAnimPhase = 'hidden' | 'rising' | 'shown' | 'sinking';

export function bridgeKey(bridge: TagBridge): string {
  return `${bridge.sourceId}:${bridge.targetId}`;
}

export function plankId(bridgeKeyStr: string, index: number): string {
  return `${bridgeKeyStr}:${index}`;
}

export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

interface BridgeMeta {
  bridge: TagBridge;
  key: string;
  plankCount: number;
}

function buildingAtEndpoint(meta: BridgeMeta, index: number): string | null {
  if (index === 0) return meta.bridge.sourceId;
  if (index === meta.plankCount - 1) return meta.bridge.targetId;
  return null;
}

function endpointIndexAtBuilding(meta: BridgeMeta, buildingId: string): number | null {
  if (buildingId === meta.bridge.sourceId) return 0;
  if (buildingId === meta.bridge.targetId) return meta.plankCount - 1;
  return null;
}

export function computeBridgePlankCount(
  bridge: TagBridge,
  positions: Map<string, readonly [number, number, number]>,
): number {
  const a = positions.get(bridge.sourceId);
  const b = positions.get(bridge.targetId);
  if (!a || !b) return 0;
  const key = bridgeKey(bridge);
  const start = new THREE.Vector3(a[0], BASE_Y, a[2]);
  const end = new THREE.Vector3(b[0], BASE_Y, b[2]);
  const curve = bridgeCurve(start, end, key);
  return computePlankCount(curve);
}

export function getBridgeRiseStartMs(
  key: string,
  plankCount: number,
  schedule: Map<string, number>,
): number {
  let min = Infinity;
  for (let i = 0; i < plankCount; i++) {
    const t = schedule.get(plankId(key, i));
    if (t !== undefined && t < min) min = t;
  }
  return min === Infinity ? 0 : min;
}

export function computeRiseEndMs(schedule: Map<string, number>): number {
  let max = 0;
  for (const startMs of schedule.values()) {
    max = Math.max(max, startMs + RISE_DURATION_MS);
  }
  return max;
}

/** Y offset from rest pose: negative = buried. */
export function riseYOffset(
  elapsedSinceRiseStart: number,
  plankStartMs: number,
): number {
  if (elapsedSinceRiseStart < plankStartMs) return -SINK_DEPTH;
  const t = clamp01((elapsedSinceRiseStart - plankStartMs) / RISE_DURATION_MS);
  return -SINK_DEPTH * (1 - easeOutBack(t));
}

export function sinkYOffset(elapsedSinceSinkStart: number): number {
  const t = clamp01(elapsedSinceSinkStart / SINK_DURATION_MS);
  return -SINK_DEPTH * easeOutCubic(t);
}

/** Sink from a captured offset (e.g. mid-rise) down to fully buried. */
export function sinkYOffsetFrom(
  startOffset: number,
  elapsedSinceSinkStart: number,
): number {
  const t = clamp01(elapsedSinceSinkStart / SINK_DURATION_MS);
  return startOffset + (-SINK_DEPTH - startOffset) * easeOutCubic(t);
}

export function computeRiseSchedule(
  bridges: TagBridge[],
  positions: Map<string, readonly [number, number, number]>,
): Map<string, number> {
  const metas: BridgeMeta[] = [];
  const bridgesByBuilding = new Map<string, BridgeMeta[]>();

  for (const bridge of bridges) {
    const key = bridgeKey(bridge);
    const plankCount = computeBridgePlankCount(bridge, positions);
    if (plankCount < 1) continue;
    const meta: BridgeMeta = { bridge, key, plankCount };
    metas.push(meta);
    for (const id of [bridge.sourceId, bridge.targetId]) {
      if (!bridgesByBuilding.has(id)) bridgesByBuilding.set(id, []);
      bridgesByBuilding.get(id)!.push(meta);
    }
  }

  const buildingIds = new Set<string>();
  for (const m of metas) {
    buildingIds.add(m.bridge.sourceId);
    buildingIds.add(m.bridge.targetId);
  }

  const adjacency = new Map<string, Set<string>>();
  for (const id of buildingIds) adjacency.set(id, new Set());
  for (const m of metas) {
    adjacency.get(m.bridge.sourceId)!.add(m.bridge.targetId);
    adjacency.get(m.bridge.targetId)!.add(m.bridge.sourceId);
  }

  const visitedBuildings = new Set<string>();
  const seeds: Array<{ key: string; index: number }> = [];

  for (const startId of [...buildingIds].sort()) {
    if (visitedBuildings.has(startId)) continue;

    const componentBuildingSet = new Set<string>();
    const bq = [startId];
    visitedBuildings.add(startId);
    componentBuildingSet.add(startId);

    while (bq.length > 0) {
      const id = bq.shift()!;
      for (const nb of adjacency.get(id) ?? []) {
        if (!visitedBuildings.has(nb)) {
          visitedBuildings.add(nb);
          componentBuildingSet.add(nb);
          bq.push(nb);
        }
      }
    }

    const componentBridges = metas
      .filter(
        (m) =>
          componentBuildingSet.has(m.bridge.sourceId) ||
          componentBuildingSet.has(m.bridge.targetId),
      )
      .sort((a, b) => a.key.localeCompare(b.key));

    if (componentBridges.length === 0) continue;
    const pick = componentBridges[0];
    seeds.push({ key: pick.key, index: Math.floor(pick.plankCount / 2) });
  }

  const metaByKey = new Map(metas.map((m) => [m.key, m]));
  const schedule = new Map<string, number>();
  const pending = new Map<string, number>();
  const activatedBuildings = new Set<string>();

  function offer(id: string, time: number) {
    const settled = schedule.get(id);
    if (settled !== undefined && settled <= time) return;
    const prev = pending.get(id);
    if (prev !== undefined && prev <= time) return;
    pending.set(id, time);
  }

  function offerPlank(key: string, index: number, time: number) {
    offer(plankId(key, index), time);
  }

  function neighbors(
    key: string,
    index: number,
  ): Array<{ key: string; index: number }> {
    const meta = metaByKey.get(key);
    if (!meta) return [];
    const out: Array<{ key: string; index: number }> = [];
    if (index > 0) out.push({ key, index: index - 1 });
    if (index < meta.plankCount - 1) out.push({ key, index: index + 1 });
    return out;
  }

  function fanOutFromBuilding(buildingId: string, time: number) {
    if (activatedBuildings.has(buildingId)) return;
    activatedBuildings.add(buildingId);
    for (const meta of bridgesByBuilding.get(buildingId) ?? []) {
      const endIdx = endpointIndexAtBuilding(meta, buildingId);
      if (endIdx !== null) offerPlank(meta.key, endIdx, time);
    }
  }

  for (const seed of seeds) {
    offerPlank(seed.key, seed.index, 0);
  }

  while (pending.size > 0) {
    let bestId: string | null = null;
    let bestTime = Infinity;
    for (const [id, time] of pending) {
      if (time < bestTime) {
        bestTime = time;
        bestId = id;
      }
    }
    if (!bestId) break;
    pending.delete(bestId);

    const existing = schedule.get(bestId);
    if (existing !== undefined && existing <= bestTime) continue;
    schedule.set(bestId, bestTime);

    const colon = bestId.lastIndexOf(':');
    const key = bestId.slice(0, colon);
    const index = Number.parseInt(bestId.slice(colon + 1), 10);
    const meta = metaByKey.get(key);
    if (!meta || Number.isNaN(index)) continue;

    const building = buildingAtEndpoint(meta, index);
    if (building !== null) {
      fanOutFromBuilding(building, bestTime);
    }

    for (const nb of neighbors(key, index)) {
      offerPlank(nb.key, nb.index, bestTime + PLANK_STAGGER_MS);
    }
  }

  return schedule;
}
