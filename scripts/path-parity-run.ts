import type { DoorDirection } from '../src/config/building-catalog';
import type { BuildingPlacement } from '../src/lib/building-placement';
import { blockCells } from '../src/lib/grid';
import { DEFAULT_MAP_CONFIG } from '../src/lib/map-config';
import { findTrunkPath } from '../src/lib/place-roads';
import type { NoteData } from '../src/lib/types';

function mockNote(id: string): NoteData {
  return {
    id,
    slug: id,
    title: id,
    size: 500,
    date: '2024-01-01',
    tags: ['shared'],
    continentId: 'parity',
  };
}

function mockBuilding(
  id: string,
  gridCol: number,
  gridRow: number,
  gridSpan: 3 | 5 | 7,
  doors: DoorDirection[],
): BuildingPlacement {
  const gridCells = blockCells(gridCol, gridRow, gridSpan);
  return {
    note: mockNote(id),
    position: [0, 0, 0],
    gridCol,
    gridRow,
    gridSpan,
    gridCells,
    sizeTier: gridSpan === 3 ? 'small' : gridSpan === 5 ? 'medium' : 'large',
    footprintExtent: 1,
    scale: [1, 1, 1],
    hue: 0,
    rotation: 0,
    modelId: 'building-small',
    doors,
  };
}

function serializeTrunk(result: ReturnType<typeof findTrunkPath>) {
  if (!result) return null;
  return {
    sourceDir: result.sourceDir,
    targetDir: result.targetDir,
    trunkCells: result.trunkCells.map(({ col, row }) => ({ col, row })),
  };
}

const cfg = DEFAULT_MAP_CONFIG;

const buildingA = mockBuilding('a', 8, 8, 3, ['s']);
const buildingB = mockBuilding('b', 18, 8, 3, ['n']);
const buildingC = mockBuilding('c', 8, 18, 5, ['e', 's']);
const buildingD = mockBuilding('d', 20, 20, 3, ['w', 'n']);

const buildings = [buildingA, buildingB, buildingC, buildingD];

const straightAToB = {
  sourceDir: 's',
  targetDir: 'n',
  trunkCells: [
    { col: 9, row: 12 },
    { col: 10, row: 12 },
    { col: 11, row: 12 },
    { col: 12, row: 12 },
    { col: 13, row: 12 },
    { col: 14, row: 12 },
    { col: 15, row: 12 },
    { col: 16, row: 12 },
    { col: 16, row: 11 },
    { col: 16, row: 10 },
    { col: 16, row: 9 },
    { col: 16, row: 8 },
    { col: 16, row: 7 },
    { col: 16, row: 6 },
    { col: 17, row: 6 },
    { col: 18, row: 6 },
    { col: 19, row: 6 },
  ],
};

const cases = [
  {
    name: 'straight-a-to-b',
    source: buildingA,
    target: buildingB,
    existing: new Set<string>(),
    golden: straightAToB,
  },
  {
    name: 'corner-c-to-d',
    source: buildingC,
    target: buildingD,
    existing: new Set<string>(),
    golden: {
      sourceDir: 'e',
      targetDir: 'w',
      trunkCells: [
        { col: 14, row: 20 },
        { col: 15, row: 20 },
        { col: 16, row: 20 },
        { col: 17, row: 20 },
        { col: 18, row: 20 },
        { col: 18, row: 21 },
      ],
    },
  },
  {
    name: 'reuse-existing-road',
    source: buildingA,
    target: buildingB,
    existing: new Set(['9,12', '9,13', '9,14']),
    golden: straightAToB,
  },
] as const;

let failed = 0;

for (const testCase of cases) {
  const first = findTrunkPath(
    cfg,
    testCase.source,
    testCase.target,
    buildings,
    testCase.existing,
  );
  const second = findTrunkPath(
    cfg,
    testCase.source,
    testCase.target,
    buildings,
    testCase.existing,
  );
  const firstJson = JSON.stringify(serializeTrunk(first));
  const secondJson = JSON.stringify(serializeTrunk(second));
  const goldenJson = JSON.stringify(testCase.golden);

  if (firstJson !== secondJson) {
    console.error(`FAIL ${testCase.name}: non-deterministic (${firstJson} vs ${secondJson})`);
    failed++;
    continue;
  }

  if (firstJson !== goldenJson) {
    console.error(`FAIL ${testCase.name}: golden mismatch`);
    console.error('  expected:', goldenJson);
    console.error('  actual:  ', firstJson);
    failed++;
    continue;
  }

  console.log(`OK ${testCase.name}`);
}

if (failed > 0) {
  console.error(`\n${failed} path parity check(s) failed`);
  process.exit(1);
}

console.log(`\nAll ${cases.length} path parity checks passed`);
