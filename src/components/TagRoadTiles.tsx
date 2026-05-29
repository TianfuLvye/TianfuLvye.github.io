import { useMemo } from 'react';
import { ROAD_TILES } from '../config/road-catalog';
import { cellCenter } from '../lib/grid';
import { ROAD_TILE_Y_OFFSET } from '../lib/map-config';
import type { RoadSegment } from '../lib/place-roads';
import { mergeActiveRoadTiles } from '../lib/road-tiles';
import GlTFModel from './GlTFModel';

interface Props {
  segments: RoadSegment[];
  activeTags: string[];
}

export default function TagRoadTiles({ segments, activeTags }: Props) {
  const tiles = useMemo(
    () => mergeActiveRoadTiles(segments, activeTags),
    [segments, activeTags],
  );

  if (tiles.length === 0) return null;

  return (
    <group>
      {tiles.map((tile) => {
        const def = ROAD_TILES[tile.kind];
        const [x, z] = cellCenter(tile.col, tile.row);
        const rotationY = tile.rotationY + def.defaultRotation;
        return (
          <group
            key={`${tile.col},${tile.row}`}
            position={[x, 0, z]}
            rotation={[0, rotationY, 0]}
          >
            <GlTFModel
              url={def.url}
              footprint={def.footprint}
              yOffset={ROAD_TILE_Y_OFFSET}
              uniformScale
              cloneMaterials={false}
              castShadow={false}
              receiveShadow={false}
            />
          </group>
        );
      })}
    </group>
  );
}
