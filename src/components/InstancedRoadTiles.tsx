import {
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import { useFrame } from '@react-three/fiber';
import { cellCenter } from '../lib/grid';
import type { ContinentMapConfig } from '../lib/map-config';
import {
  resolveRoadTileRotationY,
  roadFootprint,
  type RoadDebugSettings,
} from '../lib/road-debug';
import type { RoadSegment } from '../lib/place-roads';
import {
  buildTagPathSets,
  mergeRoadTilesForRevealedTags,
  roadTileUrl,
  type RoadTileInstance,
} from '../lib/road-tiles';
import { roadDecorClearanceCells } from '../lib/road-clearance';
import {
  APPEAR_DURATION_S,
  computeRoadRevealDistancesForPathSet,
  HIDE_DEPTH,
  HIDE_DURATION_S,
  revealStartMs,
  roadAppearYOffset,
  roadHideYOffset,
  roadUpgradeYOffset,
} from '../lib/road-reveal';
import { useWorld } from '../store';
import InstancedGltfMeshes, {
  type GltfInstanceTransform,
} from './InstancedGltfMeshes';

interface Props {
  segments: RoadSegment[];
  activeTags: string[];
  cfg: ContinentMapConfig;
}

type CellPhase = 'appearing' | 'idle' | 'upgrading' | 'hiding';

interface TagRevealState {
  pathSet: Set<string>;
  distances: Map<string, number>;
  maxDistance: number;
  startedAtMs: number;
  revealedCells: Set<string>;
}

interface LiveCell {
  cellKey: string;
  col: number;
  row: number;
  kind: RoadTileInstance['kind'];
  mask: number;
  url: string;
  rotationY: number;
  phase: CellPhase;
  phaseStartMs: number;
  hideStartMs?: number;
}

interface UrlRenderGroup {
  url: string;
  footprint: number;
  instances: GltfInstanceTransform[];
  cellKeys: string[];
  yOffsets: Float32Array;
  yOffsetsRef: MutableRefObject<Float32Array | null>;
}

function arrivalMsForCell(
  key: string,
  tagStates: Map<string, TagRevealState>,
): number {
  let min = Infinity;
  for (const state of tagStates.values()) {
    if (!state.revealedCells.has(key)) continue;
    const dist = state.distances.get(key);
    if (dist === undefined) continue;
    min = Math.min(min, revealStartMs(state.startedAtMs, dist));
  }
  return Number.isFinite(min) ? min : performance.now();
}

function syncAllRevealedTiles(
  segments: RoadSegment[],
  activeTags: string[],
  revealedCellsByTag: Map<string, Set<string>>,
  cellStates: Map<string, LiveCell>,
  tagStates: Map<string, TagRevealState>,
  roadDebug: RoadDebugSettings,
  now: number,
  newlyRevealed: Set<string>,
): boolean {
  const tiles = mergeRoadTilesForRevealedTags(
    segments,
    activeTags,
    revealedCellsByTag,
  );
  let structureChanged = false;

  for (const tile of tiles) {
    const rotationY = resolveRoadTileRotationY(tile.kind, tile.mask, roadDebug);
    const url = roadTileUrl(tile.kind, tile.mask);
    const existing = cellStates.get(tile.id);

    if (!existing) {
      cellStates.set(tile.id, {
        cellKey: tile.id,
        col: tile.col,
        row: tile.row,
        kind: tile.kind,
        mask: tile.mask,
        url,
        rotationY,
        phase: 'appearing',
        phaseStartMs: arrivalMsForCell(tile.id, tagStates),
      });
      structureChanged = true;
      continue;
    }

    if (existing.phase === 'hiding') continue;

    const geomChanged =
      existing.url !== url ||
      existing.kind !== tile.kind ||
      existing.mask !== tile.mask ||
      existing.rotationY !== rotationY;

    if (!geomChanged) continue;

    existing.col = tile.col;
    existing.row = tile.row;
    existing.kind = tile.kind;
    existing.mask = tile.mask;
    existing.url = url;
    existing.rotationY = rotationY;

    if (newlyRevealed.has(tile.id) && existing.phase === 'appearing') {
      existing.phaseStartMs = arrivalMsForCell(tile.id, tagStates);
    } else if (existing.phase === 'idle') {
      existing.phase = 'upgrading';
      existing.phaseStartMs = now;
    }

    structureChanged = true;
  }

  return structureChanged;
}

function buildRenderGroups(
  cellStates: Map<string, LiveCell>,
  cfg: ContinentMapConfig,
  roadDebug: RoadDebugSettings,
): UrlRenderGroup[] {
  const byUrl = new Map<string, UrlRenderGroup>();

  for (const cell of cellStates.values()) {
    let group = byUrl.get(cell.url);
    if (!group) {
      group = {
        url: cell.url,
        footprint: roadFootprint(roadDebug, cell.kind),
        instances: [],
        cellKeys: [],
        yOffsets: new Float32Array(0),
        yOffsetsRef: { current: null },
      };
      byUrl.set(cell.url, group);
    }

    const [x, z] = cellCenter(cfg, cell.col, cell.row);
    group.instances.push({
      id: cell.cellKey,
      position: [x, 0, z],
      rotationY: cell.rotationY,
    });
    group.cellKeys.push(cell.cellKey);
  }

  for (const group of byUrl.values()) {
    group.yOffsets = new Float32Array(group.instances.length);
    group.yOffsetsRef.current = group.yOffsets;
  }

  return [...byUrl.values()];
}

function yForCell(cell: LiveCell, now: number): { y: number; done: boolean } {
  switch (cell.phase) {
    case 'appearing': {
      const progress =
        (now - cell.phaseStartMs) / (APPEAR_DURATION_S * 1000);
      if (progress >= 1) {
        cell.phase = 'idle';
        return { y: 0, done: false };
      }
      return { y: roadAppearYOffset(progress), done: false };
    }
    case 'upgrading': {
      const progress =
        (now - cell.phaseStartMs) / (APPEAR_DURATION_S * 1000);
      if (progress >= 1) {
        cell.phase = 'idle';
        return { y: 0, done: false };
      }
      return { y: roadUpgradeYOffset(progress), done: false };
    }
    case 'hiding': {
      const start = cell.hideStartMs ?? cell.phaseStartMs;
      const progress = (now - start) / (HIDE_DURATION_S * 1000);
      if (progress >= 1) {
        return { y: -HIDE_DEPTH, done: true };
      }
      return { y: roadHideYOffset(progress), done: false };
    }
    case 'idle':
      return { y: 0, done: false };
  }
}

interface AnimatorProps {
  segments: RoadSegment[];
  activeTags: string[];
  cfg: ContinentMapConfig;
  roadDebug: RoadDebugSettings;
  renderGroups: UrlRenderGroup[];
  setRenderGroups: (groups: UrlRenderGroup[]) => void;
}

function RoadRevealAnimator({
  segments,
  activeTags,
  cfg,
  roadDebug,
  renderGroups,
  setRenderGroups,
}: AnimatorProps) {
  const tagStatesRef = useRef(new Map<string, TagRevealState>());
  const revealedCellsByTagRef = useRef(new Map<string, Set<string>>());
  const cellStatesRef = useRef(new Map<string, LiveCell>());
  const prevActiveTagsRef = useRef<string[]>([]);
  const renderGroupsRef = useRef(renderGroups);
  const prevClearanceSigRef = useRef('');
  renderGroupsRef.current = renderGroups;
  const setRoadClearanceCellKeys = useWorld((s) => s.setRoadClearanceCellKeys);

  const publishDecorClearance = () => {
    const roadKeys = [...cellStatesRef.current.keys()];
    const keys = [...roadDecorClearanceCells(roadKeys)].sort();
    const sig = keys.join('|');
    if (sig === prevClearanceSigRef.current) return;
    prevClearanceSigRef.current = sig;
    setRoadClearanceCellKeys(keys);
  };

  const rebuild = () => {
    setRenderGroups(
      buildRenderGroups(cellStatesRef.current, cfg, roadDebug),
    );
  };

  const syncSharedCellTiles = (now: number): boolean =>
    syncAllRevealedTiles(
      segments,
      activeTags,
      revealedCellsByTagRef.current,
      cellStatesRef.current,
      tagStatesRef.current,
      roadDebug,
      now,
      new Set(),
    );

  useEffect(() => {
    const now = performance.now();
    const prev = prevActiveTagsRef.current;
    const added = activeTags.filter((t) => !prev.includes(t));
    const removed = prev.filter((t) => !activeTags.includes(t));

    const tagPathSets = buildTagPathSets(segments, activeTags);
    const remainingPathSets = buildTagPathSets(segments, activeTags);
    const otherPaths = new Set<string>();
    for (const tps of remainingPathSets.values()) {
      for (const key of tps.pathSet) otherPaths.add(key);
    }

    for (const tag of added) {
      const tps = tagPathSets.get(tag);
      if (!tps || tps.pathSet.size === 0) continue;

      const distances = computeRoadRevealDistancesForPathSet(tps.pathSet);
      let maxDistance = 0;
      for (const d of distances.values()) {
        if (d > maxDistance) maxDistance = d;
      }

      tagStatesRef.current.set(tag, {
        pathSet: tps.pathSet,
        distances,
        maxDistance,
        startedAtMs: now,
        revealedCells: new Set(),
      });
      revealedCellsByTagRef.current.set(tag, new Set());
    }

    for (const tag of removed) {
      const state = tagStatesRef.current.get(tag);
      revealedCellsByTagRef.current.delete(tag);

      if (state) {
        for (const key of state.revealedCells) {
          const cell = cellStatesRef.current.get(key);
          if (!cell || cell.phase === 'hiding') continue;

          if (otherPaths.has(key)) {
            continue;
          }

          cell.phase = 'hiding';
          cell.phaseStartMs = now;
          cell.hideStartMs = now;
        }
        tagStatesRef.current.delete(tag);
      }
    }

    if (removed.length > 0) {
      syncSharedCellTiles(now);
    }

    for (const tag of added) {
      for (const [key, cell] of cellStatesRef.current) {
        if (cell.phase !== 'hiding') continue;
        const tps = tagPathSets.get(tag);
        if (!tps?.pathSet.has(key)) continue;
        cellStatesRef.current.delete(key);
      }
    }

    prevActiveTagsRef.current = [...activeTags];

    if (added.length > 0 || removed.length > 0) {
      rebuild();
    }
  }, [activeTags, segments, cfg, roadDebug, setRenderGroups]);

  useFrame(() => {
    const now = performance.now();
    let structureChanged = false;
    const toRemove: string[] = [];
    const newlyRevealed = new Set<string>();

    for (const [tag, state] of tagStatesRef.current) {
      if (!activeTags.includes(tag)) continue;

      const revealed = revealedCellsByTagRef.current.get(tag);
      if (!revealed) continue;

      for (const [key, dist] of state.distances) {
        if (state.revealedCells.has(key)) continue;

        const arrivalMs = revealStartMs(state.startedAtMs, dist);
        if (now < arrivalMs) continue;

        state.revealedCells.add(key);
        revealed.add(key);
        newlyRevealed.add(key);
      }
    }

    if (
      syncAllRevealedTiles(
        segments,
        activeTags,
        revealedCellsByTagRef.current,
        cellStatesRef.current,
        tagStatesRef.current,
        roadDebug,
        now,
        newlyRevealed,
      )
    ) {
      structureChanged = true;
    }

    if (structureChanged) {
      rebuild();
    }

    const groups = renderGroupsRef.current;
    for (const group of groups) {
      for (let i = 0; i < group.cellKeys.length; i++) {
        const key = group.cellKeys[i];
        const cell = cellStatesRef.current.get(key);
        if (!cell) {
          group.yOffsets[i] = -HIDE_DEPTH;
          continue;
        }

        const { y, done } = yForCell(cell, now);
        group.yOffsets[i] = y;

        if (done) {
          toRemove.push(key);
        }
      }
    }

    if (toRemove.length > 0) {
      for (const key of toRemove) {
        cellStatesRef.current.delete(key);
        for (const state of tagStatesRef.current.values()) {
          state.revealedCells.delete(key);
        }
        for (const revealed of revealedCellsByTagRef.current.values()) {
          revealed.delete(key);
        }
      }
      rebuild();
    }

    publishDecorClearance();
  });

  return null;
}

export default function InstancedRoadTiles({
  segments,
  activeTags,
  cfg,
}: Props) {
  const roadDebug = useWorld((s) => s.roadDebug);
  const [renderGroups, setRenderGroups] = useState<UrlRenderGroup[]>([]);

  if (activeTags.length === 0 && renderGroups.length === 0) {
    return null;
  }

  return (
    <group>
      <RoadRevealAnimator
        segments={segments}
        activeTags={activeTags}
        cfg={cfg}
        roadDebug={roadDebug}
        renderGroups={renderGroups}
        setRenderGroups={setRenderGroups}
      />
      {renderGroups.map((group) => (
        <InstancedGltfMeshes
          key={group.url}
          url={group.url}
          footprint={group.footprint}
          yOffset={roadDebug.yOffset}
          uniformScale
          instances={group.instances}
          yOffsetsRef={group.yOffsetsRef}
        />
      ))}
    </group>
  );
}
