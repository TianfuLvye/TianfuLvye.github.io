import { getBuilding } from '../config/building-catalog';
import {
  buildableCells,
  cellCenter,
  overflowCells,
  shuffleCells,
} from './grid';
import { BUILDING_FOOTPRINT_SCALE, GRID_BUILDING_ROTATION } from './map-config';
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
  /** 网格列、行索引 */
  gridCol: number;
  gridRow: number;
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

/** Approximate horizontal radius from building center to footprint edge. */
export function buildingRadius(building: BuildingPlacement): number {
  const def = getBuilding(building.modelId);
  const footprint = (def?.footprint ?? 1) * BUILDING_FOOTPRINT_SCALE;
  return footprint * building.scale[0] * 0.55;
}

/**
 * 把一个大陆的所有 note 放到网格上，一格一栋，统一朝西。
 * 用基于 continentId 的种子洗牌格位，保证位置稳定。
 */
export function placeBuildings(
  notes: NoteData[],
  _mapSize: number,
): BuildingPlacement[] {
  const continentId = notes[0]?.continentId ?? 'unknown';
  const cellRng = rngFor(`building-cells:${continentId}`);
  const primary = buildableCells();
  const overflow = overflowCells();
  shuffleCells(primary, cellRng);
  shuffleCells(overflow, cellRng);
  const cells = [...primary, ...overflow];

  const placed: BuildingPlacement[] = [];

  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    const rng = rngFor(`building:${note.id}`);

    if (i >= cells.length) {
      console.warn(
        `[placeBuildings] ${continentId}: more notes (${notes.length}) than grid cells (${cells.length}); skipping "${note.id}"`,
      );
      continue;
    }

    const { col, row } = cells[i];
    const [x, z] = cellCenter(col, row);

    const k = Math.log10(note.size + 50) / 4;
    const s = 0.85 + k * 0.55 + rng() * 0.2;

    placed.push({
      note,
      position: [x, 0, z],
      gridCol: col,
      gridRow: row,
      scale: [s, s, s],
      hue: rng() * 360,
      roof: rng(),
      rotation: GRID_BUILDING_ROTATION,
      modelId: pickBuildingModel(note),
    });
  }

  return placed;
}
