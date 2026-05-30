import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, OrthographicCamera, MapControls } from '@react-three/drei';
import * as THREE from 'three';
import { getBuilding } from '../config/building-catalog';
import type { ContinentData, NoteData } from '../lib/types';
import { gridLineSegments } from '../lib/grid';
import type { BuildingPlacement } from '../lib/layout';
import { placeContinentLayout } from '../lib/place-continent-layout';
import {
  continentMapConfig,
  GRID_BUILDING_ROTATION,
  type ContinentMapConfig,
} from '../lib/map-config';
import { placeDecorations } from '../lib/place-decorations';
import { useWorld } from '../store';
import GlTFModel from './GlTFModel';
import InstancedDecorations from './InstancedDecorations';
import InstancedRoadTiles from './InstancedRoadTiles';
import MapModelPreload from './MapModelPreload';

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
  const mapConfig = useMemo(
    () => continentMapConfig(continent.notes.length),
    [continent.notes.length],
  );
  const layout = useMemo(
    () => placeContinentLayout(continent.notes, mapConfig),
    [continent.notes, mapConfig],
  );
  const { buildings, tagRoadSegments } = layout;
  const sortKey = useWorld((s) => s.sortKey);
  const hoveredNoteIds = useWorld((s) => s.hoveredNoteIds);
  const activeTags = useWorld((s) => s.activeTags);
  const clearActiveTags = useWorld((s) => s.clearActiveTags);
  const selectNote = useWorld((s) => s.selectNote);
  const selectedNoteId = useWorld((s) => s.selectedNote?.id ?? null);
  const showGridDebug = useWorld((s) => s.showGridDebug);

  const tagHighlightIds = useMemo(() => {
    if (activeTags.length === 0) return new Set<string>();
    const active = new Set(activeTags);
    return new Set(
      continent.notes
        .filter((n) => n.tags.some((t) => active.has(t)))
        .map((n) => n.id),
    );
  }, [continent.notes, activeTags]);

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
  const htmlDistanceFactor = useOrthoHtmlDistanceFactor(1);

  const hoveredNoteIdSet = useMemo(
    () => new Set(hoveredNoteIds),
    [hoveredNoteIds],
  );

  return (
    <>
      <MapModelPreload buildings={buildings} />
      <OrthographicCamera
        makeDefault
        zoom={mapConfig.cameraZoom}
        position={[
          mapConfig.mapSize * 0.5,
          mapConfig.mapSize * 0.5,
          mapConfig.mapSize * 0.5,
        ]}
        near={0.1}
        far={mapConfig.mapSize * 4}
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
        }}
        onContextMenu={(e) => {
          e.stopPropagation();
          e.nativeEvent.preventDefault();
          clearActiveTags();
        }}
      >
        <planeGeometry args={[mapConfig.mapSize, mapConfig.mapSize, 1, 1]} />
        <meshStandardMaterial color="#d9c79a" roughness={0.95} />
      </mesh>

      {/* 海岸线 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[mapConfig.mapSize + 4, mapConfig.mapSize + 4, 1, 1]} />
        <meshStandardMaterial color="#264a6b" roughness={0.6} />
      </mesh>

      {showGridDebug && <GridOverlay cfg={mapConfig} />}

      {/* 一些装饰性的小树 / 灌木 */}
      <Decorations
        continentId={continent.id}
        cfg={mapConfig}
        buildings={buildings}
      />

      <InstancedRoadTiles
        segments={tagRoadSegments}
        activeTags={activeTags}
        cfg={mapConfig}
      />

      {/* 建筑物 */}
      {buildings.map((b) => (
        <Building
          key={b.note.id}
          placement={b}
          isHovered={hoveredNoteIdSet.has(b.note.id)}
          isSelected={selectedNoteId === b.note.id}
          isTagHighlighted={
            activeTags.length > 0 && tagHighlightIds.has(b.note.id)
          }
          isFloating={isSorted}
          floatRank={sortRank.get(b.note.id) ?? 0}
          totalCount={continent.notes.length}
          htmlDistanceFactor={htmlDistanceFactor}
          onClick={() => selectNote(b.note)}
          onDoubleClick={() => onOpenNote(b.note)}
        />
      ))}

      <MapControls
        enableRotate={false}
        enableZoom={true}
        minZoom={Math.round(mapConfig.cameraZoom * 0.25)}
        maxZoom={Math.round(mapConfig.cameraZoom * 1.5)}
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
  isTagHighlighted: boolean;
  isFloating: boolean;
  floatRank: number;
  totalCount: number;
  htmlDistanceFactor: number;
  onClick: () => void;
  onDoubleClick: () => void;
}

const Building = memo(function Building({
  placement,
  isHovered,
  isSelected,
  isTagHighlighted,
  isFloating,
  floatRank,
  totalCount,
  htmlDistanceFactor,
  onClick,
  onDoubleClick,
}: BuildingProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const [motionActive, setMotionActive] = useState(isFloating);

  useEffect(() => {
    if (isFloating) {
      setMotionActive(true);
      return;
    }
    const y = groupRef.current?.position.y ?? 0;
    const rot = groupRef.current?.rotation.y ?? GRID_BUILDING_ROTATION;
    const needsSettle =
      Math.abs(y) > 0.001 ||
      Math.abs(rot - GRID_BUILDING_ROTATION) > 0.001;
    setMotionActive(needsSettle);
  }, [isFloating]);

  // 漂浮目标高度：排名越靠前 → 浮得越高（但还是基于位置稳定）
  const floatHeight = useMemo(() => {
    if (!isFloating) return 0;
    const norm = totalCount > 1 ? 1 - floatRank / (totalCount - 1) : 1;
    return 1.6 + norm * 2.2;
  }, [isFloating, floatRank, totalCount]);

  const emphasize = hover || isHovered || isSelected || isTagHighlighted;
  const buildingDef = getBuilding(placement.modelId);
  const labelLift = placement.footprintExtent * 0.4 + 0.35;

  if (!buildingDef) return null;

  return (
    <group
      ref={groupRef}
      position={[placement.position[0], 0, placement.position[2]]}
    >
      {motionActive && (
        <BuildingMotion
          groupRef={groupRef}
          isFloating={isFloating}
          floatHeight={floatHeight}
          floatRank={floatRank}
          onSettled={() => setMotionActive(false)}
        />
      )}
      <GlTFModel
          url={buildingDef.url}
          footprint={placement.footprintExtent}
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
});

interface BuildingMotionProps {
  groupRef: React.RefObject<THREE.Group>;
  isFloating: boolean;
  floatHeight: number;
  floatRank: number;
  onSettled: () => void;
}

function BuildingMotion({
  groupRef,
  isFloating,
  floatHeight,
  floatRank,
  onSettled,
}: BuildingMotionProps) {
  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;
    const t = state.clock.elapsedTime;
    if (isFloating) {
      const phase = floatRank * 0.6;
      const bob = Math.sin(t * 1.3 + phase) * 0.08;
      const target = floatHeight + bob;
      group.position.y = THREE.MathUtils.lerp(group.position.y, target, 0.08);
      group.rotation.y = THREE.MathUtils.lerp(
        group.rotation.y,
        GRID_BUILDING_ROTATION + Math.sin(t * 0.4 + phase) * 0.04,
        0.05,
      );
      return;
    }

    group.position.y = THREE.MathUtils.lerp(group.position.y, 0, 0.1);
    group.rotation.y = THREE.MathUtils.lerp(
      group.rotation.y,
      GRID_BUILDING_ROTATION,
      0.1,
    );

    if (
      Math.abs(group.position.y) < 0.001 &&
      Math.abs(group.rotation.y - GRID_BUILDING_ROTATION) < 0.001
    ) {
      group.position.y = 0;
      group.rotation.y = GRID_BUILDING_ROTATION;
      onSettled();
    }
  });

  return null;
}

/* ---------- Grid overlay ---------- */

function GridOverlay({ cfg }: { cfg: ContinentMapConfig }) {
  const geometry = useMemo(() => {
    const segments = gridLineSegments(cfg);
    const positions = new Float32Array(segments.length * 6);
    segments.forEach(([a, b], i) => {
      const o = i * 6;
      positions[o] = a[0];
      positions[o + 1] = a[1];
      positions[o + 2] = a[2];
      positions[o + 3] = b[0];
      positions[o + 4] = b[1];
      positions[o + 5] = b[2];
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [cfg]);

  return (
    <lineSegments geometry={geometry} renderOrder={1}>
      <lineBasicMaterial color="#8a7355" transparent opacity={0.5} />
    </lineSegments>
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
  cfg,
  buildings,
}: {
  continentId: string;
  cfg: ContinentMapConfig;
  buildings: BuildingPlacement[];
}) {
  const items = useMemo(
    () =>
      placeDecorations({
        continentId,
        cfg,
        buildings,
      }),
    [continentId, cfg, buildings],
  );

  return <InstancedDecorations items={items} />;
}
