import {
  doorsForBuildingId,
  getBuilding,
  type SizeTier,
} from '../config/building-catalog';
import {
  type BuildingPlacement,
  footprintExtentForTier,
} from './building-placement';
import {
  blockCellsWithMargin,
  buildableBlockAnchors,
  blockCells,
  blockCenter,
  cellKey,
  overflowBlockAnchors,
  shuffleCells,
  type GridCell,
} from './grid';
import {
  BUILDING_MIN_GAP,
  BUILDING_SPAN_LARGE,
  BUILDING_SPAN_MEDIUM,
  BUILDING_SPAN_SMALL,
  GRID_BUILDING_ROTATION,
  type BuildingGridSpan,
  type ContinentMapConfig,
} from './map-config';
import { sizeTierFromNoteSize } from './note-size';
import { pickBuildingModel } from './pick-building-model';
import { rngFor } from './random';
import type { NoteData } from './types';

const TIER_PLACE_ORDER: Record<SizeTier, number> = {
  large: 0,
  medium: 1,
  small: 2,
};

function tierForNote(note: NoteData, modelId: string): SizeTier {
  const def = getBuilding(modelId);
  return def?.sizeTier ?? sizeTierFromNoteSize(note.size);
}

function gridSpanForTier(tier: SizeTier): BuildingGridSpan {
  switch (tier) {
    case 'small':
      return BUILDING_SPAN_SMALL;
    case 'medium':
      return BUILDING_SPAN_MEDIUM;
    case 'large':
      return BUILDING_SPAN_LARGE;
  }
}

const SPAN_PLACE_ORDER: BuildingGridSpan[] = [
  BUILDING_SPAN_LARGE,
  BUILDING_SPAN_MEDIUM,
  BUILDING_SPAN_SMALL,
];

function spanLabel(span: BuildingGridSpan): string {
  return `${span}×${span}`;
}

function blockIsFree(
  anchor: GridCell,
  span: BuildingGridSpan,
  taken: Set<string>,
): boolean {
  const cells = blockCells(anchor.col, anchor.row, span);
  return cells.every((c) => {
    const k = cellKey(c.col, c.row);
    return !taken.has(k);
  });
}

function markBlockWithGap(
  cfg: ContinentMapConfig,
  anchor: GridCell,
  span: BuildingGridSpan,
  taken: Set<string>,
): void {
  for (const c of blockCellsWithMargin(
    cfg,
    anchor.col,
    anchor.row,
    span,
    BUILDING_MIN_GAP,
  )) {
    taken.add(cellKey(c.col, c.row));
  }
}

function nextFreeAnchor(
  anchors: GridCell[],
  startIdx: number,
  span: BuildingGridSpan,
  taken: Set<string>,
): { anchor: GridCell; nextIdx: number } | null {
  for (let i = startIdx; i < anchors.length; i++) {
    if (blockIsFree(anchors[i], span, taken)) {
      return { anchor: anchors[i], nextIdx: i + 1 };
    }
  }
  return null;
}

/**
 * Place notes on the fine grid: small 3×3, medium 5×5, large 7×7,
 * with BUILDING_MIN_GAP empty cells between footprints.
 */
export function placeBuildings(
  notes: NoteData[],
  cfg: ContinentMapConfig,
): BuildingPlacement[] {
  const continentId = notes[0]?.continentId ?? 'unknown';
  const cellRng = rngFor(`building-cells:${continentId}`);

  const anchorsBySpan = new Map<BuildingGridSpan, GridCell[]>();
  const anchorIdx = new Map<BuildingGridSpan, number>();
  for (const span of SPAN_PLACE_ORDER) {
    const anchors = [
      ...buildableBlockAnchors(cfg, span),
      ...overflowBlockAnchors(cfg, span),
    ];
    shuffleCells(anchors, cellRng);
    anchorsBySpan.set(span, anchors);
    anchorIdx.set(span, 0);
  }

  const meta = notes.map((note) => {
    const modelId = pickBuildingModel(note);
    return {
      note,
      modelId,
      sizeTier: tierForNote(note, modelId),
    };
  });

  const sorted = [...meta].sort((a, b) => {
    const d = TIER_PLACE_ORDER[a.sizeTier] - TIER_PLACE_ORDER[b.sizeTier];
    if (d !== 0) return d;
    return a.note.id.localeCompare(b.note.id);
  });

  const taken = new Set<string>();
  const placed: BuildingPlacement[] = [];

  for (const { note, modelId, sizeTier } of sorted) {
    const rng = rngFor(`building:${note.id}`);
    const gridSpan = gridSpanForTier(sizeTier);
    const anchors = anchorsBySpan.get(gridSpan)!;
    let idx = anchorIdx.get(gridSpan)!;

    const slot = nextFreeAnchor(anchors, idx, gridSpan, taken);

    if (!slot) {
      console.warn(
        `[placeBuildings] ${continentId}: no free ${spanLabel(gridSpan)} slot for "${note.id}" (${sizeTier})`,
      );
      continue;
    }

    anchorIdx.set(gridSpan, slot.nextIdx);

    const { col, row } = slot.anchor;
    markBlockWithGap(cfg, slot.anchor, gridSpan, taken);

    const gridCells = blockCells(col, row, gridSpan);
    const [x, z] = blockCenter(cfg, col, row, gridSpan);

    placed.push({
      note,
      position: [x, 0, z],
      gridCol: col,
      gridRow: row,
      gridSpan,
      gridCells,
      sizeTier,
      footprintExtent: footprintExtentForTier(sizeTier, rng, cfg),
      scale: [1, 1, 1],
      hue: rng() * 360,
      rotation: GRID_BUILDING_ROTATION,
      modelId,
      doors: doorsForBuildingId(modelId),
    });
  }

  return placed;
}
