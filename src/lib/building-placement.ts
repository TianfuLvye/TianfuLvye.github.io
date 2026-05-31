import type { DoorDirection, SizeTier } from '../config/building-catalog';
import { DIR_BIT, DIR_OFFSET, opposite } from './direction';
import { isInBounds, type GridCell } from './grid';
import {
  type BuildingGridSpan,
  type ContinentMapConfig,
} from './map-config';
import { rangeFrom } from './random';
import type { NoteData } from './types';

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
