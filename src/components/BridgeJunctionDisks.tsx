// TODO: junction disk detailed implementation (materials, animation sync, plank cutout)

import { GRID_BRIDGE_JUNCTION_DISK_DIAMETER } from '../lib/map-config';
import type { BridgeJunction } from '../lib/place-bridges';

interface Props {
  junctions: BridgeJunction[];
  visible: boolean;
}

const DISK_HEIGHT = 0.04;
const RADIUS = GRID_BRIDGE_JUNCTION_DISK_DIAMETER / 2;

export default function BridgeJunctionDisks({ junctions, visible }: Props) {
  if (!visible || junctions.length === 0) return null;

  return (
    <group>
      {junctions.map((j) => (
        <mesh
          key={`${j.col},${j.row}`}
          position={[
            j.position[0],
            j.position[1] + DISK_HEIGHT / 2,
            j.position[2],
          ]}
          renderOrder={2}
        >
          <cylinderGeometry args={[RADIUS, RADIUS, DISK_HEIGHT, 24]} />
          <meshStandardMaterial color="#6b4a2a" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}
