import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrthographicCamera, MapControls } from '@react-three/drei';
import * as THREE from 'three';
import { getBuilding } from '../config/building-catalog';
import type { ContinentData, NoteData } from '../lib/types';
import { gridLineSegments } from '../lib/grid';
import type { BuildingPlacement } from '../lib/building-placement';
import { placeContinentLayout } from '../lib/place-continent-layout';
import {
  continentMapConfig,
  GRID_BUILDING_ROTATION,
  type ContinentMapConfig,
} from '../lib/map-config';
import { placeDecorations } from '../lib/place-decorations';
import { compareNotes } from '../lib/note-sort';
import { useWorld } from '../store';
import BuildingPickVolume from './BuildingPickVolume';
import GlTFModel from './GlTFModel';
import InstancedBuildings from './InstancedBuildings';
import InstancedDecorations from './InstancedDecorations';
import InstancedRoadTiles from './InstancedRoadTiles';
import MapModelPreload from './MapModelPreload';
import OrthoScaledHtml from './OrthoScaledHtml';
import RoadWalkBlockedOverlay from './RoadWalkBlockedOverlay';

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
  const showRoadWalkBlockedDebug = useWorld((s) => s.showRoadWalkBlockedDebug);

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
    const sorted = [...continent.notes].sort(compareNotes(sortKey));
    const m = new Map<string, number>();
    sorted.forEach((n, i) => m.set(n.id, i));
    return m;
  }, [continent.notes, sortKey]);

  const isSorted = sortKey !== 'default';
  const [pointerHoveredId, setPointerHoveredId] = useState<string | null>(null);

  const hoveredNoteIdSet = useMemo(
    () => new Set(hoveredNoteIds),
    [hoveredNoteIds],
  );

  const emphasizedIds = useMemo(() => {
    const ids = new Set<string>();
    if (selectedNoteId) ids.add(selectedNoteId);
    for (const id of hoveredNoteIds) ids.add(id);
    if (activeTags.length > 0) {
      for (const id of tagHighlightIds) ids.add(id);
    }
    if (pointerHoveredId) ids.add(pointerHoveredId);
    return ids;
  }, [
    selectedNoteId,
    hoveredNoteIds,
    activeTags.length,
    tagHighlightIds,
    pointerHoveredId,
  ]);

  const buildingNoteById = useMemo(() => {
    const m = new Map<string, NoteData>();
    for (const b of buildings) m.set(b.note.id, b.note);
    return m;
  }, [buildings]);

  const handleBuildingClick = useCallback(
    (noteId: string) => {
      const note = buildingNoteById.get(noteId);
      if (note) selectNote(note);
    },
    [buildingNoteById, selectNote],
  );

  const handleBuildingDoubleClick = useCallback(
    (noteId: string) => {
      const note = buildingNoteById.get(noteId);
      if (note) onOpenNote(note);
    },
    [buildingNoteById, onOpenNote],
  );

  const handleBuildingPointerHover = useCallback(
    (noteId: string, hover: boolean) => {
      setPointerHoveredId((prev) =>
        hover ? noteId : prev === noteId ? null : prev,
      );
    },
    [],
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

      {showRoadWalkBlockedDebug && (
        <RoadWalkBlockedOverlay cfg={mapConfig} buildings={buildings} />
      )}

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

      {!isSorted && (
        <InstancedBuildings
          buildings={buildings}
          hiddenIds={emphasizedIds}
        />
      )}

      {/* 建筑物：交互、标签、高亮 / sort 模式逐座渲染 */}
      {buildings.map((b) => (
        <Building
          key={b.note.id}
          noteId={b.note.id}
          placement={b}
          isHovered={hoveredNoteIdSet.has(b.note.id)}
          isSelected={selectedNoteId === b.note.id}
          isTagHighlighted={
            activeTags.length > 0 && tagHighlightIds.has(b.note.id)
          }
          isPointerHovered={pointerHoveredId === b.note.id}
          showVisual={isSorted || emphasizedIds.has(b.note.id)}
          isFloating={isSorted}
          floatRank={sortRank.get(b.note.id) ?? 0}
          totalCount={continent.notes.length}
          onPointerHover={handleBuildingPointerHover}
          onClick={handleBuildingClick}
          onDoubleClick={handleBuildingDoubleClick}
        />
      ))}

      <MapControls
        enableRotate={false}
        enableZoom={true}
        minZoom={mapConfig.cameraMinZoom}
        maxZoom={mapConfig.cameraMaxZoom}
        screenSpacePanning={true}
      />
    </>
  );
}

/* ---------- Building ---------- */

interface BuildingProps {
  noteId: string;
  placement: BuildingPlacement;
  isHovered: boolean;
  isSelected: boolean;
  isTagHighlighted: boolean;
  isPointerHovered: boolean;
  showVisual: boolean;
  isFloating: boolean;
  floatRank: number;
  totalCount: number;
  onPointerHover: (noteId: string, hover: boolean) => void;
  onClick: (noteId: string) => void;
  onDoubleClick: (noteId: string) => void;
}

const Building = memo(function Building({
  noteId,
  placement,
  isHovered,
  isSelected,
  isTagHighlighted,
  isPointerHovered,
  showVisual,
  isFloating,
  floatRank,
  totalCount,
  onPointerHover,
  onClick,
  onDoubleClick,
}: BuildingProps) {
  const groupRef = useRef<THREE.Group>(null);
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

  const emphasize =
    isPointerHovered || isHovered || isSelected || isTagHighlighted;
  const buildingDef = getBuilding(placement.modelId);
  const labelLift = placement.footprintExtent * 0.4 + 0.35;

  if (!buildingDef) return null;

  const pickHandlers = useMemo(
    () => ({
      onClick: (e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        onClick(noteId);
      },
      onDoubleClick: (e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        onDoubleClick(noteId);
      },
      onPointerOver: (e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        onPointerHover(noteId, true);
        document.body.style.cursor = 'pointer';
      },
      onPointerOut: (e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        onPointerHover(noteId, false);
        document.body.style.cursor = '';
      },
    }),
    [noteId, onClick, onDoubleClick, onPointerHover],
  );

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
      {showVisual ? (
        <GlTFModel
          url={buildingDef.url}
          footprint={placement.footprintExtent}
          scale={placement.scale}
          uniformScale
          yOffset={buildingDef.yOffset}
          emphasized={emphasize}
          interactive
          {...pickHandlers}
        />
      ) : (
        <BuildingPickVolume
          url={buildingDef.url}
          footprint={placement.footprintExtent}
          scale={placement.scale}
          uniformScale
          yOffset={buildingDef.yOffset}
          {...pickHandlers}
        />
      )}

      {/* sort_by 模式下，漂浮块下方的 pattern 浮空陆地 */}
      {isFloating && (
        <FloatingPattern y={-0.12} hue={placement.hue} />
      )}

      {/* sort_by 模式下，漂浮的牌子 */}
      {isFloating && (
        <OrthoScaledHtml
          position={[0, -0.7, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div className="island-sign">{placement.note.title}</div>
        </OrthoScaledHtml>
      )}

      {/* 普通悬停 / 选中：浮出标签 */}
      {emphasize && !isFloating && (
        <OrthoScaledHtml
          position={[0, labelLift, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div className="building-label">{placement.note.title}</div>
        </OrthoScaledHtml>
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
