import { useMemo } from 'react';
import { getBuilding } from '../config/building-catalog';
import type { BuildingPlacement } from '../lib/building-placement';
import InstancedGltfMeshes, {
  type GltfInstanceTransform,
} from './InstancedGltfMeshes';

interface GroupedBuilding {
  modelId: string;
  url: string;
  footprint: number;
  yOffset?: number;
  instances: GltfInstanceTransform[];
}

function groupBuildings(buildings: BuildingPlacement[]): GroupedBuilding[] {
  const groups = new Map<string, GroupedBuilding>();

  for (const placement of buildings) {
    const def = getBuilding(placement.modelId);
    if (!def) continue;

    let group = groups.get(placement.modelId);
    if (!group) {
      group = {
        modelId: placement.modelId,
        url: def.url,
        footprint: def.footprint,
        yOffset: def.yOffset,
        instances: [],
      };
      groups.set(placement.modelId, group);
    }

    group.instances.push({
      id: placement.note.id,
      position: placement.position,
      rotationY: placement.rotation,
      scale: placement.footprintExtent / def.footprint,
    });
  }

  return [...groups.values()];
}

interface Props {
  buildings: BuildingPlacement[];
  /** Instances hidden (scale 0) while a per-building GlTFModel draws on top. */
  hiddenIds: ReadonlySet<string>;
}

export default function InstancedBuildings({ buildings, hiddenIds }: Props) {
  const groups = useMemo(() => groupBuildings(buildings), [buildings]);

  return (
    <group>
      {groups.map((group) => (
        <InstancedGltfMeshes
          key={group.modelId}
          url={group.url}
          footprint={group.footprint}
          yOffset={group.yOffset}
          uniformScale
          castShadow={false}
          receiveShadow
          hiddenIds={hiddenIds}
          instances={group.instances}
        />
      ))}
    </group>
  );
}
