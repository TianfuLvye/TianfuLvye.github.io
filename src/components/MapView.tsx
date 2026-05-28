import { useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, OrthographicCamera, MapControls } from '@react-three/drei';
import * as THREE from 'three';
import { getBuilding } from '../config/building-catalog';
import { pickDecorationId } from '../config/decoration-catalog';
import type { DecorationId } from '../config/decoration-catalog';
import type { ContinentData, NoteData } from '../lib/types';
import { placeBuildings, type BuildingPlacement } from '../lib/layout';
import {
  BUILDING_FOOTPRINT_SCALE,
  MAP_CAMERA_ZOOM,
  MAP_SIZE,
} from '../lib/map-config';
import {
  isNearBridgeCorridor,
  sampleBridgeCorridor,
} from '../lib/plank-bridge';
import { rngFor, rangeFrom } from '../lib/random';
import type { TagBridge } from '../lib/types';
import { useWorld } from '../store';
import GlTFModel from './GlTFModel';
import DecorationModel from './DecorationModel';
import MapModelPreload from './MapModelPreload';
import TagBridgePaths from './TagBridgePaths';

/**
 * drei Html 在 OrthographicCamera 下用 scale = zoom × distanceFactor。
 * 固定 distanceFactor=6 会在 zoom=48 时得到 scale=288。按 zoom 反比补偿，使屏幕 scale ≈ multiplier。
 */
function useOrthoHtmlDistanceFactor(multiplier = 1) {
  const camera = useThree((s) => s.camera);
  const [factor, setFactor] = useState(() =>
    camera instanceof THREE.OrthographicCamera
      ? multiplier / camera.zoom
      : multiplier,
  );

  useFrame(() => {
    if (!(camera instanceof THREE.OrthographicCamera)) return;
    const next = multiplier / camera.zoom;
    setFactor((prev) => (Math.abs(prev - next) > 1e-5 ? next : prev));
  });

  return factor;
}

interface Props {
  continent: ContinentData;
  onOpenNote: (note: NoteData) => void;
}

export default function MapView({ continent, onOpenNote }: Props) {
  const buildings = useMemo(
    () => placeBuildings(continent.notes, MAP_SIZE),
    [continent.notes],
  );
  const sortKey = useWorld((s) => s.sortKey);
  const hoveredNoteIds = useWorld((s) => s.hoveredNoteIds);
  const selectNote = useWorld((s) => s.selectNote);
  const selectedNoteId = useWorld((s) => s.selectedNote?.id ?? null);
  const showTagPaths = useWorld((s) => s.showTagPaths);
  const selectTagBridge = useWorld((s) => s.selectTagBridge);

  // 根据 sortKey 排序，决定每个 note 的"漂浮顺序"
  const sortRank = useMemo(() => {
    const sorted = [...continent.notes].sort((a, b) => {
      switch (sortKey) {
        case 'size':
          return b.size - a.size;
        case 'name':
          return a.title.localeCompare(b.title);
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        default:
          return 0;
      }
    });
    const m = new Map<string, number>();
    sorted.forEach((n, i) => m.set(n.id, i));
    return m;
  }, [continent.notes, sortKey]);

  const isSorted = sortKey !== 'default';

  return (
    <>
      <MapModelPreload buildings={buildings} />
      <OrthographicCamera
        makeDefault
        zoom={MAP_CAMERA_ZOOM}
        position={[
          MAP_SIZE * 0.5,
          MAP_SIZE * 0.5,
          MAP_SIZE * 0.5,
        ]}
        near={0.1}
        far={100}
      />

      <ambientLight intensity={0.7} color="#fff1d6" />
      <directionalLight
        position={[10, 14, 6]}
        intensity={1.0}
        color="#fff1d6"
        castShadow
      />
      <hemisphereLight args={['#fdf6e3', '#3a4d6b', 0.35]} />

      {/* 大地 */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          selectNote(null);
          selectTagBridge(null);
        }}
      >
        <planeGeometry args={[MAP_SIZE, MAP_SIZE, 1, 1]} />
        <meshStandardMaterial color="#d9c79a" roughness={0.95} />
      </mesh>

      {/* 海岸线 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[MAP_SIZE + 4, MAP_SIZE + 4, 1, 1]} />
        <meshStandardMaterial color="#264a6b" roughness={0.6} />
      </mesh>

      {/* 一些装饰性的小树 / 灌木 */}
      <Decorations
        continentId={continent.id}
        mapSize={MAP_SIZE}
        bridges={continent.tagBridges}
        buildings={buildings}
      />

      {continent.tagBridges.length > 0 && (
        <TagBridgePaths
          bridges={continent.tagBridges}
          buildings={buildings}
          visible={showTagPaths}
        />
      )}

      {/* 建筑物 */}
      {buildings.map((b) => (
        <Building
          key={b.note.id}
          placement={b}
          isHovered={hoveredNoteIds.includes(b.note.id)}
          isSelected={selectedNoteId === b.note.id}
          isFloating={isSorted}
          floatRank={sortRank.get(b.note.id) ?? 0}
          totalCount={continent.notes.length}
          onClick={() => selectNote(b.note)}
          onDoubleClick={() => onOpenNote(b.note)}
        />
      ))}

      <MapControls
        enableRotate={false}
        enableZoom={true}
        minZoom={20}
        maxZoom={100}
        screenSpacePanning={true}
      />
    </>
  );
}

/* ---------- Building ---------- */

interface BuildingProps {
  placement: BuildingPlacement;
  isHovered: boolean;
  isSelected: boolean;
  isFloating: boolean;
  floatRank: number;
  totalCount: number;
  onClick: () => void;
  onDoubleClick: () => void;
}

function Building({
  placement,
  isHovered,
  isSelected,
  isFloating,
  floatRank,
  totalCount,
  onClick,
  onDoubleClick,
}: BuildingProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const htmlDistanceFactor = useOrthoHtmlDistanceFactor(1);

  // 漂浮目标高度：排名越靠前 → 浮得越高（但还是基于位置稳定）
  const floatHeight = useMemo(() => {
    if (!isFloating) return 0;
    const norm = totalCount > 1 ? 1 - floatRank / (totalCount - 1) : 1;
    return 1.6 + norm * 2.2;
  }, [isFloating, floatRank, totalCount]);

  // 微动画
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    if (isFloating) {
      // 平滑过渡到目标高度 + 漂浮抖动
      const phase = floatRank * 0.6;
      const bob = Math.sin(t * 1.3 + phase) * 0.08;
      const target = floatHeight + bob;
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        target,
        0.08,
      );
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        placement.rotation + Math.sin(t * 0.4 + phase) * 0.04,
        0.05,
      );
    } else {
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        0,
        0.1,
      );
    }
  });

  const emphasize = hover || isHovered || isSelected;
  const buildingDef = getBuilding(placement.modelId);
  const labelLift = placement.scale[0] * 0.55 + 0.35;

  if (!buildingDef) return null;

  return (
    <group
      ref={groupRef}
      position={[placement.position[0], 0, placement.position[2]]}
    >
      <group rotation={[0, placement.rotation, 0]}>
        <GlTFModel
          url={buildingDef.url}
          footprint={buildingDef.footprint * BUILDING_FOOTPRINT_SCALE}
          scale={placement.scale}
          uniformScale
          yOffset={buildingDef.yOffset}
          emphasized={emphasize}
          interactive
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
            setHover(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setHover(false);
            document.body.style.cursor = '';
          }}
        />
      </group>

      {/* sort_by 模式下，漂浮块下方的 pattern 浮空陆地 */}
      {isFloating && (
        <FloatingPattern y={-0.12} hue={placement.hue} />
      )}

      {/* sort_by 模式下，漂浮的牌子 */}
      {isFloating && (
        <Html
          position={[0, -0.7, 0]}
          center
          distanceFactor={htmlDistanceFactor}
          style={{ pointerEvents: 'none' }}
        >
          <div className="island-sign">{placement.note.title}</div>
        </Html>
      )}

      {/* 普通悬停 / 选中：浮出标签 */}
      {emphasize && !isFloating && (
        <Html
          position={[0, labelLift, 0]}
          center
          distanceFactor={htmlDistanceFactor}
          style={{ pointerEvents: 'none' }}
        >
          <div className="building-label">{placement.note.title}</div>
        </Html>
      )}
    </group>
  );
}

/* ---------- Floating ground pattern ---------- */

function FloatingPattern({ y, hue }: { y: number; hue: number }) {
  // 一块带边纹的薄六边形
  const color = `hsl(${hue}, 18%, 32%)`;
  const edge = `hsl(${hue}, 22%, 22%)`;
  return (
    <group position={[0, y, 0]}>
      <mesh>
        <cylinderGeometry args={[0.95, 0.95, 0.18, 6]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {/* 边纹 */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.7, -0.12, Math.sin(a) * 0.7]}
            rotation={[0, -a, 0]}
          >
            <boxGeometry args={[0.18, 0.22, 0.08]} />
            <meshStandardMaterial color={edge} roughness={0.95} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ---------- Decorations ---------- */

function Decorations({
  continentId,
  mapSize,
  bridges,
  buildings,
}: {
  continentId: string;
  mapSize: number;
  bridges: TagBridge[];
  buildings: BuildingPlacement[];
}) {
  const corridor = useMemo(
    () => sampleBridgeCorridor(bridges, buildings),
    [bridges, buildings],
  );

  const items = useMemo(() => {
    const rng = rngFor(`decor:${continentId}`);
    const half = mapSize / 2;
    const arr: Array<{
      decorId: DecorationId;
      x: number;
      z: number;
      scale: number;
      rotation: number;
    }> = [];
    let attempts = 0;
    const target = Math.round(40 * (mapSize / 18));
    while (arr.length < target && attempts < 320) {
      attempts++;
      const x = rangeFrom(rng, -half + 0.5, half - 0.5);
      const z = rangeFrom(rng, -half + 0.5, half - 0.5);
      if (isNearBridgeCorridor(x, z, corridor)) continue;
      arr.push({
        decorId: pickDecorationId(rng),
        x,
        z,
        scale: 1,
        rotation: rng() * Math.PI * 2,
      });
    }
    return arr;
  }, [continentId, mapSize, corridor]);

  return (
    <group>
      {items.map((it, i) => (
        <DecorationModel
          key={`${it.decorId}-${i}`}
          decorId={it.decorId}
          scale={it.scale}
          rotation={it.rotation}
          position={[it.x, 0, it.z]}
        />
      ))}
    </group>
  );
}
