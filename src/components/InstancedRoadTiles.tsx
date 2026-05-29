import { useMemo } from 'react';
import { ROAD_TILES } from '../config/road-catalog';
import { cellCenter } from '../lib/grid';
import { ROAD_TILE_Y_OFFSET } from '../lib/map-config';
import type { RoadSegment } from '../lib/place-roads';
import { mergeActiveRoadTiles } from '../lib/road-tiles';
import InstancedGltfMeshes, {
  type GltfInstanceTransform,
} from './InstancedGltfMeshes';

interface Props {
  segments: RoadSegment[];
  activeTags: string[];
}

export default function InstancedRoadTiles({ segments, activeTags }: Props) {
  const tiles = useMemo(
    () => mergeActiveRoadTiles(segments, activeTags),
    [segments, activeTags],
  );

  const grouped = useMemo(() => {
    const byKind = new Map<
      string,
      {
        url: string;
        footprint: number;
        instances: GltfInstanceTransform[];
      }
    >();

    for (const tile of tiles) {
      const def = ROAD_TILES[tile.kind];
      let group = byKind.get(tile.kind);
      if (!group) {
        group = {
          url: def.url,
          footprint: def.footprint,
          instances: [],
        };
        byKind.set(tile.kind, group);
      }

      const [x, z] = cellCenter(tile.col, tile.row);
      group.instances.push({
        position: [x, 0, z],
        rotationY: tile.rotationY + def.defaultRotation,
      });
    }

    return [...byKind.values()];
  }, [tiles]);

  if (grouped.length === 0) return null;

  return (
    <group>
      {grouped.map((group) => (
        <InstancedGltfMeshes
          key={group.url}
          url={group.url}
          footprint={group.footprint}
          yOffset={ROAD_TILE_Y_OFFSET}
          uniformScale
          instances={group.instances}
        />
      ))}
    </group>
  );
}
