import { useMemo } from 'react';
import { getDecoration } from '../config/decoration-catalog';
import { DECOR_FOOTPRINT_SCALE } from '../lib/map-config';
import type { DecorationPlacement } from '../lib/place-decorations';
import InstancedGltfMeshes, {
  type GltfInstanceTransform,
} from './InstancedGltfMeshes';

interface GroupedDecor {
  decorId: string;
  url: string;
  footprint: number;
  fitExtent: 'xz' | 'y' | 'max';
  scaleMin?: number;
  scaleMax?: number;
  instances: GltfInstanceTransform[];
}

function groupDecorations(items: DecorationPlacement[]): GroupedDecor[] {
  const groups = new Map<string, GroupedDecor>();

  for (const item of items) {
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
      };
      groups.set(item.decorId, group);
    }

    group.instances.push({
      position: item.position,
      rotationY: item.rotation,
      scale: item.scale,
    });
  }

  return [...groups.values()];
}

interface Props {
  items: DecorationPlacement[];
}

export default function InstancedDecorations({ items }: Props) {
  const groups = useMemo(() => groupDecorations(items), [items]);

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
        />
      ))}
    </group>
  );
}
