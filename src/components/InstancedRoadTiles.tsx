import { useMemo } from 'react';
import {
  ROAD_TILES,
  straightRoadUrlForMask,
} from '../config/road-catalog';
import { cellCenter } from '../lib/grid';
import { resolveRoadTileRotationY, roadFootprint } from '../lib/road-debug';
import type { RoadSegment } from '../lib/place-roads';
import { mergeActiveRoadTiles } from '../lib/road-tiles';
import { useWorld } from '../store';
import InstancedGltfMeshes, {
  type GltfInstanceTransform,
} from './InstancedGltfMeshes';

interface Props {
  segments: RoadSegment[];
  activeTags: string[];
}

export default function InstancedRoadTiles({ segments, activeTags }: Props) {
  const roadDebug = useWorld((s) => s.roadDebug);

  const tiles = useMemo(
    () => mergeActiveRoadTiles(segments, activeTags),
    [segments, activeTags],
  );

  const grouped = useMemo(() => {
    const byUrl = new Map<
      string,
      {
        url: string;
        footprint: number;
        instances: GltfInstanceTransform[];
      }
    >();

    for (const tile of tiles) {
      const url =
        tile.kind === 'straight'
          ? straightRoadUrlForMask(tile.mask)
          : ROAD_TILES[tile.kind].url;
      const footprint = roadFootprint(roadDebug, tile.kind);

      let group = byUrl.get(url);
      if (!group) {
        group = { url, footprint, instances: [] };
        byUrl.set(url, group);
      }

      const [x, z] = cellCenter(tile.col, tile.row);
      group.instances.push({
        position: [x, 0, z],
        rotationY: resolveRoadTileRotationY(tile.kind, tile.mask, roadDebug),
      });
    }

    return [...byUrl.values()];
  }, [tiles, roadDebug]);

  if (grouped.length === 0) return null;

  return (
    <group>
      {grouped.map((group) => (
        <InstancedGltfMeshes
          key={group.url}
          url={group.url}
          footprint={group.footprint}
          yOffset={roadDebug.yOffset}
          uniformScale
          instances={group.instances}
        />
      ))}
    </group>
  );
}
