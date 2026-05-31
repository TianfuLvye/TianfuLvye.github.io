/**
 * 地图细网格的占用状态(建筑 / 森林 / 花丛 / 散布植物)与到建筑的距离场。
 * 原本内联在 grid.ts;它体量大且承载明确的领域职责,抽成独立文件让 grid.ts
 * 回归"无状态的网格几何工具"。逻辑未改动。
 */
import {
  cellKey,
  chebyshevDistance,
  parseCellKey,
  type GridCell,
} from './grid';
import type { ContinentMapConfig } from './map-config';

export class GridOccupancy {
  private buildings = new Map<string, string>();
  private forests = new Map<string, number>();
  private flowerPatches = new Set<string>();
  private plantCounts = new Map<string, number>();
  private buildingDist: Float32Array | null = null;

  constructor(private readonly cfg: ContinentMapConfig) {}

  private key(col: number, row: number): string {
    return cellKey(col, row);
  }

  markBuildingCells(cells: GridCell[], noteId: string): void {
    for (const { col, row } of cells) {
      this.setBuilding(col, row, noteId);
    }
    this.buildingDist = null;
  }

  setBuilding(col: number, row: number, noteId: string): void {
    this.buildings.set(cellKey(col, row), noteId);
    this.buildingDist = null;
  }

  hasBuilding(col: number, row: number): boolean {
    return this.buildings.has(cellKey(col, row));
  }

  setForest(col: number, row: number, forestId: number): void {
    this.forests.set(cellKey(col, row), forestId);
  }

  hasForest(col: number, row: number): boolean {
    return this.forests.has(cellKey(col, row));
  }

  getBuildingCells(): GridCell[] {
    const out: GridCell[] = [];
    for (const k of this.buildings.keys()) {
      out.push(parseCellKey(k));
    }
    return out;
  }

  setFlowerPatch(col: number, row: number): void {
    this.flowerPatches.add(this.key(col, row));
  }

  hasFlowerPatch(col: number, row: number): boolean {
    return this.flowerPatches.has(this.key(col, row));
  }

  incrementPlants(col: number, row: number): void {
    const k = this.key(col, row);
    this.plantCounts.set(k, (this.plantCounts.get(k) ?? 0) + 1);
  }

  isOccupiedForWild(col: number, row: number): boolean {
    return (
      this.hasBuilding(col, row) ||
      this.hasForest(col, row) ||
      this.hasFlowerPatch(col, row)
    );
  }

  private ensureBuildingDist(): void {
    if (this.buildingDist) return;

    const { gridCols, gridRows } = this.cfg;
    const dist = new Float32Array(gridCols * gridRows);
    dist.fill(Infinity);
    const buildingCells = this.getBuildingCells();
    if (buildingCells.length === 0) {
      this.buildingDist = dist;
      return;
    }

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        let min = Infinity;
        for (const b of buildingCells) {
          min = Math.min(min, chebyshevDistance({ col, row }, b));
        }
        dist[row * gridCols + col] = min;
      }
    }
    this.buildingDist = dist;
  }

  minChebyshevToBuilding(col: number, row: number): number {
    this.ensureBuildingDist();
    return this.buildingDist![row * this.cfg.gridCols + col];
  }
}
