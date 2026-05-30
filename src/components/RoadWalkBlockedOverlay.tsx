import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { cellCenter } from '../lib/grid';
import type { ContinentMapConfig } from '../lib/map-config';
import type { BuildingPlacement } from '../lib/layout';
import { computeRoadWalkBlockedLayers } from '../lib/place-roads';

interface Props {
  cfg: ContinentMapConfig;
  buildings: BuildingPlacement[];
}

interface CellPlaneInstancesProps {
  cellKeys: string[];
  cfg: ContinentMapConfig;
  y: number;
  color: string;
  opacity: number;
}

function CellPlaneInstances({
  cellKeys,
  cfg,
  y,
  color,
  opacity,
}: CellPlaneInstancesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(cfg.cellSize * 0.92, cfg.cellSize * 0.92);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [cfg.cellSize]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    cellKeys.forEach((key, i) => {
      const [col, row] = key.split(',').map(Number);
      const [x, z] = cellCenter(cfg, col, row);
      position.set(x, y, z);
      matrix.makeTranslation(position.x, position.y, position.z);
      mesh.setMatrixAt(i, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [cellKeys, cfg, y]);

  if (cellKeys.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      key={cellKeys.length}
      args={[geometry, undefined, cellKeys.length]}
      renderOrder={2}
      frustumCulled={false}
    >
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

export default function RoadWalkBlockedOverlay({ cfg, buildings }: Props) {
  const layers = useMemo(
    () => computeRoadWalkBlockedLayers(cfg, buildings),
    [cfg, buildings],
  );

  const footprintKeys = useMemo(
    () => [...layers.footprints],
    [layers.footprints],
  );
  const doorZoneKeys = useMemo(
    () => [...layers.doorZones],
    [layers.doorZones],
  );

  return (
    <group>
      <CellPlaneInstances
        cellKeys={footprintKeys}
        cfg={cfg}
        y={0.06}
        color="#c0392b"
        opacity={0.28}
      />
      <CellPlaneInstances
        cellKeys={doorZoneKeys}
        cfg={cfg}
        y={0.07}
        color="#e67e22"
        opacity={0.42}
      />
    </group>
  );
}
