import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { getDecoration } from '../config/decoration-catalog';
import { worldToCell } from '../lib/forest-zones';
import { cellKey, isInBounds } from '../lib/grid';
import type { ContinentMapConfig } from '../lib/map-config';
import { DECOR_FOOTPRINT_SCALE } from '../lib/map-config';
import type { DecorationPlacement } from '../lib/place-decorations';
import InstancedGltfMeshes, {
  type GltfInstanceTransform,
} from './InstancedGltfMeshes';

const DECOR_FADE_SPEED = 7;

function decorCellKeyAt(
  cfg: ContinentMapConfig,
  x: number,
  z: number,
): string | null {
  const half = cfg.mapSize / 2;
  const col = Math.floor((x + half) / cfg.cellSize);
  const row = Math.floor((z + half) / cfg.cellSize);
  if (!isInBounds(cfg, col, row)) return null;
  return cellKey(col, row);
}

interface GroupedDecor {
  decorId: string;
  url: string;
  footprint: number;
  fitExtent: 'xz' | 'y' | 'max';
  scaleMin?: number;
  scaleMax?: number;
  instances: GltfInstanceTransform[];
  opacityRef: { current: Float32Array };
}

function groupDecorations(
  items: DecorationPlacement[],
  cfg: ContinentMapConfig,
): GroupedDecor[] {
  const groups = new Map<string, GroupedDecor>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const def = getDecoration(item.decorId);
    if (!def) continue;

    let group = groups.get(item.decorId);
    if (!group) {
      const footprint = (def.footprint ?? 0.55) * DECOR_FOOTPRINT_SCALE;
      group = {
        decorId: item.decorId,
        url: def.url,
        footprint,
        fitExtent: def.fitExtent ?? 'xz',
        scaleMin:
          def.scaleMin != null
            ? def.scaleMin * DECOR_FOOTPRINT_SCALE
            : undefined,
        scaleMax:
          def.scaleMax != null
            ? def.scaleMax * DECOR_FOOTPRINT_SCALE
            : undefined,
        instances: [],
        opacityRef: { current: new Float32Array(0) },
      };
      groups.set(item.decorId, group);
    }

    const cell = worldToCell(cfg, item.position[0], item.position[2]);
    const id = cell ? cellKey(cell.col, cell.row) : `decor:${i}`;

    group.instances.push({
      id,
      position: item.position,
      rotationY: item.rotation,
      scale: item.scale,
    });
  }

  for (const group of groups.values()) {
    group.opacityRef.current = new Float32Array(group.instances.length);
    group.opacityRef.current.fill(1);
  }

  return [...groups.values()];
}

interface Props {
  items: DecorationPlacement[];
  cfg: ContinentMapConfig;
  clearanceCellKeys: string[];
}

export default function InstancedDecorations({
  items,
  cfg,
  clearanceCellKeys,
}: Props) {
  const groups = useMemo(
    () => groupDecorations(items, cfg),
    [items, cfg],
  );
  const clearanceSet = useMemo(
    () => new Set(clearanceCellKeys),
    [clearanceCellKeys],
  );
  const clearanceSetRef = useRef(clearanceSet);
  clearanceSetRef.current = clearanceSet;
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;
  const groupsRef = useRef(groups);
  groupsRef.current = groups;

  useFrame((_, delta) => {
    const blend = 1 - Math.exp(-DECOR_FADE_SPEED * delta);
    const clearance = clearanceSetRef.current;
    const mapCfg = cfgRef.current;

    for (const group of groupsRef.current) {
      const opacities = group.opacityRef.current;
      for (let i = 0; i < group.instances.length; i++) {
        const inst = group.instances[i];
        const key = decorCellKeyAt(
          mapCfg,
          inst.position[0],
          inst.position[2],
        );
        const target = key && clearance.has(key) ? 0 : 1;
        opacities[i] += (target - opacities[i]) * blend;
      }
    }
  });

  return (
    <group>
      {groups.map((group) => (
        <InstancedGltfMeshes
          key={group.decorId}
          url={group.url}
          footprint={group.footprint}
          uniformScale
          fitExtent={group.fitExtent}
          scaleMin={group.scaleMin}
          scaleMax={group.scaleMax}
          scale={[1, 1, 1]}
          instances={group.instances}
          opacityRef={group.opacityRef}
        />
      ))}
    </group>
  );
}
