import {
  doorsForBuildingId,
  getBuilding,
  type DoorDirection,
  type SizeTier,
} from '../config/building-catalog';
import { DIR_BIT, DIR_OFFSET, opposite } from './direction';
import {
  blockCellsWithMargin,
  buildableBlockAnchors,
  blockCells,
  blockCenter,
  cellKey,
  isInBounds,
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
  /** 占地锚点格（块左上角） */
  gridCol: number;
  gridRow: number;
  /** 3 = 小，5 = 中，7 = 大（细格） */
  gridSpan: BuildingGridSpan;
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
  /** 围绕 Y 轴的旋转 */
  rotation: number;
  /** GLB 建筑模型 id */
  modelId: string;
  /** Grid sides where roads may attach (from building catalog). */
  doors: DoorDirection[];
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

/** 按体量档计算建筑水平占地（占满对应 N×N 地块）。 */
export function footprintExtentForTier(
  tier: SizeTier,
  rng: () => number,
  cfg: ContinentMapConfig,
): number {
  switch (tier) {
    case 'small':
      return rangeFrom(
        rng,
        cfg.footprintMax.small * 0.82,
        cfg.footprintMax.small,
      );
    case 'medium':
      return rangeFrom(
        rng,
        cfg.footprintMax.medium * 0.85,
        cfg.footprintMax.medium,
      );
    case 'large':
      return rangeFrom(
        rng,
        cfg.footprintMax.large * 0.88,
        cfg.footprintMax.large,
      );
  }
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

/** Grid center of building footprint (for tag graph distance). */
export function gridPositionForBuilding(
  building: BuildingPlacement,
): readonly [number, number] {
  const half = (building.gridSpan - 1) / 2;
  return [building.gridCol + half, building.gridRow + half] as const;
}

/**
 * 路瓦片"指向建筑"的连接位(N=1, E=2, S=4, W=8)。
 * 路铺在门的外侧,所以从路指向建筑的方向 = 门方向取反:
 * 门朝 e,路就在 e 侧、需朝 w 才指回建筑 → DIR_BIT['w']。
 */
export function doorFacingMask(dir: DoorDirection): number {
  return DIR_BIT[opposite(dir)];
}

export function doorConnectionCell(
  building: BuildingPlacement,
  dir: DoorDirection,
): GridCell {
  const span = building.gridSpan;
  const half = (span - 1) / 2;
  const centerCol = building.gridCol + half;
  const centerRow = building.gridRow + half;
  // 门格落在 footprint 紧贴的外侧那一格(用 span/-1 定位到建筑边缘,非单位方向)。
  switch (dir) {
    case 'n':
      return { col: centerCol, row: building.gridRow - 1 };
    case 'e':
      return { col: building.gridCol + span, row: centerRow };
    case 's':
      return { col: centerCol, row: building.gridRow + span };
    case 'w':
      return { col: building.gridCol - 1, row: centerRow };
  }
}

/** Trunk terminates one cell outward from the door (away from the building). */
export function doorApproachCell(
  building: BuildingPlacement,
  dir: DoorDirection,
): GridCell {
  const door = doorConnectionCell(building, dir);
  const { dc, dr } = DIR_OFFSET[dir];
  return { col: door.col + dc, row: door.row + dr };
}

export interface BuildingDoorApproach {
  dir: DoorDirection;
  door: GridCell;
  approach: GridCell;
}

export function buildingDoorApproaches(
  cfg: ContinentMapConfig,
  building: BuildingPlacement,
): BuildingDoorApproach[] {
  return building.doors
    .map((dir) => ({
      dir,
      door: doorConnectionCell(building, dir),
      approach: doorApproachCell(building, dir),
    }))
    .filter(
      ({ door, approach }) =>
        isInBounds(cfg, door.col, door.row) &&
        isInBounds(cfg, approach.col, approach.row),
    );
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
