import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { WorldTree } from '../lib/types';
import { placeContinents } from '../lib/layout';
import { useWorld } from '../store';

const GLOBE_RADIUS = 2.4;

interface Props {
  tree: WorldTree;
  /** 双击大陆时由父组件触发云转场后进入 map */
  onEnter: (continentId: string) => void;
}

export default function Globe({ tree, onEnter }: Props) {
  const placements = useMemo(
    () => placeContinents(tree, GLOBE_RADIUS),
    [tree],
  );
  const groupRef = useRef<THREE.Group>(null);
  const focused = useWorld((s) => s.focusedContinent);
  const focusContinent = useWorld((s) => s.focusContinent);

  // 缓慢自转
  useFrame((_, dt) => {
    if (groupRef.current && !focused) {
      groupRef.current.rotation.y += dt * 0.05;
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 7]} fov={45} />

      <ambientLight intensity={0.55} color="#d8c9ae" />
      <directionalLight position={[5, 4, 6]} intensity={1.1} color="#fff1d6" />
      <directionalLight position={[-6, -2, -3]} intensity={0.4} color="#5d7fb3" />

      <group ref={groupRef}>
        {/* 海洋球体 */}
        <mesh>
          <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
          <meshStandardMaterial
            color="#1f3a5a"
            roughness={0.6}
            metalness={0.05}
          />
        </mesh>

        {/* 大陆 */}
        {placements.map((p) => (
          <Continent
            key={p.continent.id}
            placement={p}
            isFocused={focused === p.continent.id}
            onClick={() => focusContinent(p.continent.id)}
            onDoubleClick={() => onEnter(p.continent.id)}
            onMissed={() => {
              if (focused === p.continent.id) focusContinent(null);
            }}
          />
        ))}
      </group>

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={4}
        maxDistance={9}
        rotateSpeed={0.6}
      />
    </>
  );
}

interface ContinentProps {
  placement: ReturnType<typeof placeContinents>[number];
  isFocused: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  onMissed: () => void;
}

function Continent({
  placement,
  isFocused,
  onClick,
  onDoubleClick,
  onMissed,
}: ContinentProps) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  // 让长方体的 +Y 面对齐表面外法线方向
  const quaternion = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3(...placement.position).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(up, normal);
    // 围绕法线再加一个自转
    const spin = new THREE.Quaternion().setFromAxisAngle(normal, placement.spin);
    return spin.multiply(q);
  }, [placement.position, placement.spin]);

  // 大陆要稍微嵌进球面（向内偏移半个高度），看上去像"嵌在地球上"
  const offsetPos = useMemo(() => {
    const n = new THREE.Vector3(...placement.position).normalize();
    const halfH = placement.scale[1] / 2;
    const pos = new THREE.Vector3(...placement.position).sub(
      n.multiplyScalar(halfH * 0.5),
    );
    return pos.toArray() as [number, number, number];
  }, [placement.position, placement.scale]);

  const label = placement.continent.label;
  const noteCount = placement.continent.notes.length;
  const emphasize = isFocused || hovered;

  return (
    <group position={offsetPos} quaternion={quaternion}>
      <mesh
        ref={meshRef}
        scale={placement.scale}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onDoubleClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = '';
        }}
        onPointerMissed={onMissed}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={emphasize ? '#f5e6c3' : '#e8d4a8'}
          roughness={0.85}
          emissive={emphasize ? '#3a2e16' : '#000'}
          emissiveIntensity={emphasize ? 0.35 : 0}
        />
      </mesh>

      {emphasize && (
        <Html
          position={[0, placement.scale[1] / 2 + 0.25, 0]}
          center
          distanceFactor={6}
          zIndexRange={[0, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="globe-label">
            <div className="globe-label-name">{label}</div>
            <div className="globe-label-meta">
              {noteCount} {noteCount === 1 ? 'note' : 'notes'}
            </div>
            <div className="globe-label-hint">double-click to land</div>
          </div>
        </Html>
      )}
    </group>
  );
}
