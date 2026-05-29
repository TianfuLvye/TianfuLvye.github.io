import { getBuilding, type SizeTier } from '../config/building-catalog';
import {
  buildable2x2Anchors,
  buildableCells,
  buildingGridCells,
  buildingWorldCenter,
  cellKey,
  overflow2x2Anchors,
  overflowCells,
  shuffleCells,
  type GridCell,
} from './grid';
import {
  BUILDING_LARGE_FOOTPRINT_MAX,
  BUILDING_MEDIUM_FOOTPRINT_MAX,
  BUILDING_SMALL_FOOTPRINT_MAX,
  GRID_BUILDING_ROTATION,
} from './map-config';
import { sizeTierFromNoteSize } from './note-size';
import { pickBuildingModel } from './pick-building-model';
import { rngFor, rangeFrom } from './random';
import type { ContinentData, NoteData } from './types';

/**
 * 黄金角分布在球面上铺 N 个点。
 * 返回的位置是单位球面上的笛卡尔坐标。
 */
export function fibonacciSphere(n: number): Array<[number, number, number]> {
  const points: Array<[number, number, number]> = [];
  const phi = Math.PI * (3 - Math.sqrt(5)); // 黄金角
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / Math.max(n - 1, 1)) * 2; // [1, -1]
    const radius = Math.sqrt(1 - y * y);
    const theta = phi * i;
    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;
    points.push([x, y, z]);
  }
  return points;
}

export interface ContinentPlacement {
  continent: ContinentData;
  /** 大陆中心点（已乘上球半径） */
  position: [number, number, number];
  /** 大陆尺寸（长方体的三边），根据 totalSize 调节 */
  scale: [number, number, number];
  /** 围绕表面法线的旋转（弧度） */
  spin: number;
}

/**
 * 把每个大陆放到球面上。
 * 这里我们用 fibonacci sphere 拿到均匀分布，
 * 然后基于 continent.id 引入一点抖动，让位置不那么"工整"。
 */
export function placeContinents(
  continents: ContinentData[],
  radius: number,
): ContinentPlacement[] {
  // 排序保证位置稳定（先按 id 排）
  const sorted = [...continents].sort((a, b) => a.id.localeCompare(b.id));
  const base = fibonacciSphere(Math.max(sorted.length, 1));

  return sorted.map((c, i) => {
    const rng = rngFor(`continent:${c.id}`);
    const [bx, by, bz] = base[i % base.length];

    // 在基准方向附近做小抖动
    const jitter = 0.18;
    const jx = bx + rangeFrom(rng, -jitter, jitter);
    const jy = by + rangeFrom(rng, -jitter, jitter);
    const jz = bz + rangeFrom(rng, -jitter, jitter);
    const len = Math.sqrt(jx * jx + jy * jy + jz * jz) || 1;
    const nx = jx / len;
    const ny = jy / len;
    const nz = jz / len;

    // 大陆体量基于 totalSize，但做对数压缩
    const sizeFactor = Math.log10(c.totalSize + 100) / 4; // 经验值
    const w = 0.65 + sizeFactor + rng() * 0.25;
    const d = 0.65 + sizeFactor + rng() * 0.25;
    const h = 0.18 + rng() * 0.18;

    return {
      continent: c,
      position: [nx * radius, ny * radius, nz * radius],
      scale: [w, h, d],
      spin: rng() * Math.PI * 2,
    };
  });
}

export interface BuildingPlacement {
  note: NoteData;
  /** 平面上 (x, z) 位置；y 高度由 height 决定 */
  position: [number, number, number];
  /** 占地锚点格（1×1 为格心；2×2 为左上角） */
  gridCol: number;
  gridRow: number;
  /** 1 = 单格，2 = 2×2 地块 */
  gridSpan: 1 | 2;
  /** 占用的所有格 */
  gridCells: GridCell[];
  /** 体量档 */
  sizeTier: SizeTier;
  /** 目标水平占地（世界单位），用于 GLB 缩放 */
  footprintExtent: number;
  /** 均匀缩放 [s, s, s]（保持模型原始比例） */
  scale: [number, number, number];
  /** 颜色（HSL hue） */
  hue: number;
  /** 屋顶倾斜 (0 = 平顶，1 = 尖屋顶) */
  roof: number;
  /** 围绕 Y 轴的旋转 */
  rotation: number;
  /** GLB 建筑模型 id */
  modelId: string;
}

const TIER_PLACE_ORDER: Record<SizeTier, number> = {
  large: 0,
  medium: 1,
  small: 2,
};

function tierForNote(note: NoteData, modelId: string): SizeTier {
  const def = getBuilding(modelId);
  return def?.sizeTier ?? sizeTierFromNoteSize(note.size);
}

function gridSpanForTier(tier: SizeTier): 1 | 2 {
  return tier === 'small' ? 1 : 2;
}

/** 按体量档计算建筑水平占地，中型不超过 2 格面积。 */
export function footprintExtentForTier(
  tier: SizeTier,
  rng: () => number,
): number {
  switch (tier) {
    case 'small':
      return rangeFrom(
        rng,
        BUILDING_SMALL_FOOTPRINT_MAX * 0.82,
        BUILDING_SMALL_FOOTPRINT_MAX,
      );
    case 'medium':
      return rangeFrom(
        rng,
        BUILDING_MEDIUM_FOOTPRINT_MAX * 0.85,
        BUILDING_MEDIUM_FOOTPRINT_MAX,
      );
    case 'large':
      return rangeFrom(
        rng,
        BUILDING_LARGE_FOOTPRINT_MAX * 0.88,
        BUILDING_LARGE_FOOTPRINT_MAX,
      );
  }
}

/** Approximate horizontal radius from building center to footprint edge. */
export function buildingRadius(building: BuildingPlacement): number {
  return building.footprintExtent * 0.5;
}

function blockIsFree(
  anchor: GridCell,
  span: 1 | 2,
  taken: Set<string>,
  blockedCells: Set<string>,
): boolean {
  const cells = buildingGridCells(anchor.col, anchor.row, span);
  return cells.every((c) => {
    const k = cellKey(c.col, c.row);
    return !taken.has(k) && !blockedCells.has(k);
  });
}

function markBlock(
  anchor: GridCell,
  span: 1 | 2,
  taken: Set<string>,
): void {
  for (const c of buildingGridCells(anchor.col, anchor.row, span)) {
    taken.add(cellKey(c.col, c.row));
  }
}

function nextFreeAnchor(
  anchors: GridCell[],
  startIdx: number,
  span: 1 | 2,
  taken: Set<string>,
  blockedCells: Set<string>,
): { anchor: GridCell; nextIdx: number } | null {
  for (let i = startIdx; i < anchors.length; i++) {
    if (blockIsFree(anchors[i], span, taken, blockedCells)) {
      return { anchor: anchors[i], nextIdx: i + 1 };
    }
  }
  return null;
}

/** Grid coordinates for building placement (Chebyshev). */
export function gridPositionForBuilding(
  building: BuildingPlacement,
): readonly [number, number] {
  if (building.gridSpan === 1) {
    return [building.gridCol, building.gridRow] as const;
  }
  return [building.gridCol + 0.5, building.gridRow + 0.5] as const;
}

/**
 * 把一个大陆的所有 note 放到网格上：小型 1 格，中型/大型 2×2 地块。
 * 中型建筑实际占地不超过 2 格面积；统一朝西。
 */
export function placeBuildings(
  notes: NoteData[],
  _mapSize: number,
  options?: { blockedCells?: Set<string> },
): BuildingPlacement[] {
  const blockedCells = options?.blockedCells ?? new Set<string>();
  const continentId = notes[0]?.continentId ?? 'unknown';
  const cellRng = rngFor(`building-cells:${continentId}`);

  const singleAnchors = [...buildableCells(), ...overflowCells()];
  const blockAnchors = [
    ...buildable2x2Anchors(),
    ...overflow2x2Anchors(),
  ];
  shuffleCells(singleAnchors, cellRng);
  shuffleCells(blockAnchors, cellRng);

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
  let singleIdx = 0;
  let blockIdx = 0;

  for (const { note, modelId, sizeTier } of sorted) {
    const rng = rngFor(`building:${note.id}`);
    const gridSpan = gridSpanForTier(sizeTier);

    const slot =
      gridSpan === 1
        ? nextFreeAnchor(singleAnchors, singleIdx, 1, taken, blockedCells)
        : nextFreeAnchor(blockAnchors, blockIdx, 2, taken, blockedCells);

    if (!slot) {
      console.warn(
        `[placeBuildings] ${continentId}: no free ${gridSpan === 1 ? '1×1' : '2×2'} slot for "${note.id}" (${sizeTier})`,
      );
      continue;
    }

    if (gridSpan === 1) singleIdx = slot.nextIdx;
    else blockIdx = slot.nextIdx;

    const { col, row } = slot.anchor;
    markBlock(slot.anchor, gridSpan, taken);

    const gridCells = buildingGridCells(col, row, gridSpan);
    const [x, z] = buildingWorldCenter(col, row, gridSpan);

    placed.push({
      note,
      position: [x, 0, z],
      gridCol: col,
      gridRow: row,
      gridSpan,
      gridCells,
      sizeTier,
      footprintExtent: footprintExtentForTier(sizeTier, rng),
      scale: [1, 1, 1],
      hue: rng() * 360,
      roof: rng(),
      rotation: GRID_BUILDING_ROTATION,
      modelId,
    });
  }

  return placed;
}
