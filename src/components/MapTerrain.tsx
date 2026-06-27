import { useMemo, type ThreeEvent } from 'react';
import * as THREE from 'three';
import {
  seaExtent,
  TERRAIN_BEACH_COLOR,
  TERRAIN_GROUND_COLOR,
  TERRAIN_PLATFORM_Y,
  TERRAIN_REEF_COLOR,
  TERRAIN_SEA_COLOR,
  terrainReefOutward,
  terrainSeaY,
  type ContinentMapConfig,
} from '../lib/map-config';
import {
  buildBeachSkirts,
  buildReefSkirts,
  getBeachSideGeometry,
  getReefSideGeometry,
} from '../lib/reef-zones';

interface Props {
  mapConfig: ContinentMapConfig;
  onGroundClick?: (e: ThreeEvent<MouseEvent>) => void;
  onGroundContextMenu?: (e: ThreeEvent<MouseEvent>) => void;
}

export default function MapTerrain({
  mapConfig,
  onGroundClick,
  onGroundContextMenu,
}: Props) {
  const seaSize = seaExtent(mapConfig);
  const mapHalf = mapConfig.mapSize / 2;
  const reefOut = terrainReefOutward(mapConfig);
  const seaY = terrainSeaY(mapConfig);

  const reefSkirts = useMemo(
    () => buildReefSkirts(mapConfig),
    [mapConfig],
  );

  const beachSkirts = useMemo(
    () => buildBeachSkirts(mapConfig),
    [mapConfig],
  );

  return (
    <group>
      {/* Sea — large unlit plane; canvas bg matches this color as fallback */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, seaY, 0]}
        renderOrder={0}
        frustumCulled={false}
        raycast={() => null}
      >
        <planeGeometry args={[seaSize, seaSize, 1, 1]} />
        <meshBasicMaterial color={TERRAIN_SEA_COLOR} side={THREE.DoubleSide} />
      </mesh>

      {/* Flat ground platform — render before skirts so slopes are not depth-occluded */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, TERRAIN_PLATFORM_Y, 0]}
        renderOrder={1}
        receiveShadow
        onClick={onGroundClick}
        onContextMenu={onGroundContextMenu}
      >
        <planeGeometry args={[mapConfig.mapSize, mapConfig.mapSize, 1, 1]} />
        <meshStandardMaterial color={TERRAIN_GROUND_COLOR} roughness={0.9} />
      </mesh>

      {/* Reef skirts — four sides (orange in sketch), drawn on top of ground edges */}
      {reefSkirts.map((skirt) => (
        <mesh
          key={`reef-${skirt.side}`}
          geometry={getReefSideGeometry(
            skirt.side,
            mapHalf,
            skirt.topY,
            skirt.bottomY,
            skirt.outward,
          )}
          renderOrder={2}
          frustumCulled={false}
          castShadow
          receiveShadow
          raycast={() => null}
        >
          <meshStandardMaterial
            color={TERRAIN_REEF_COLOR}
            roughness={0.88}
            metalness={0.04}
            flatShading
          />
        </mesh>
      ))}

      {/* Beach frustums — top edge matches reef bottom footprint */}
      {beachSkirts.map((skirt) => (
        <mesh
          key={`beach-${skirt.side}`}
          geometry={getBeachSideGeometry(
            skirt.side,
            mapHalf + reefOut,
            skirt.topY,
            skirt.bottomY,
            skirt.outward,
          )}
          renderOrder={3}
          frustumCulled={false}
          castShadow
          receiveShadow
          raycast={() => null}
        >
          <meshStandardMaterial
            color={TERRAIN_BEACH_COLOR}
            roughness={0.92}
            metalness={0.02}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}
