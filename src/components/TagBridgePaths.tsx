import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { BridgePlacement } from '../lib/place-bridges';
import {
  BASE_Y,
  buildBridgeMeshSpec,
  buildPlankGeometry,
  pickPlankIndexAtPoint,
  WOOD_DARK,
  type BridgeMeshSpec,
  type PlankSpec,
} from '../lib/plank-bridge';
import {
  bridgeKey,
  computeRiseEndMs,
  computeRiseSchedule,
  getBridgeRiseStartMs,
  plankId,
  riseYOffset,
  SINK_DEPTH,
  SINK_DURATION_MS,
  sinkYOffsetFrom,
  type TagBridgeAnimPhase,
} from '../lib/tag-bridge-animation';
import type { TagBridge } from '../lib/types';
import { useWorld } from '../store';

interface Props {
  bridges: TagBridge[];
  bridgePlacements: BridgePlacement[];
  visible: boolean;
}

const HOVER_PLANK_LIFT = 0.05;
const SELECTED_BRIDGE_LIFT = 0.04;
const BRIDGE_EMISSIVE = 0.14;

interface AnimContextValue {
  phase: TagBridgeAnimPhase;
  riseSchedule: Map<string, number>;
  riseStartMs: number;
  sinkStartMs: number;
}

interface BridgeInteractionValue {
  hoveredBridgeKey: string | null;
  hoveredPlankIndex: number | null;
  interactive: boolean;
  setHover: (bridgeKey: string | null, plankIndex: number | null) => void;
}

const TagBridgeAnimationContext = createContext<AnimContextValue | null>(null);
const BridgeInteractionContext = createContext<BridgeInteractionValue | null>(
  null,
);

function useTagBridgeAnimation(): AnimContextValue {
  const ctx = useContext(TagBridgeAnimationContext);
  if (!ctx) throw new Error('TagBridgeAnimationContext missing');
  return ctx;
}

function useBridgeInteraction(): BridgeInteractionValue {
  const ctx = useContext(BridgeInteractionContext);
  if (!ctx) throw new Error('BridgeInteractionContext missing');
  return ctx;
}

const geometryCache = new Map<string, THREE.BufferGeometry>();

function getPlankGeometry(seed: string): THREE.BufferGeometry {
  let geo = geometryCache.get(seed);
  if (!geo) {
    geo = buildPlankGeometry(seed);
    geometryCache.set(seed, geo);
  }
  return geo;
}

function useYOffsetRef(plankStartMs: number): MutableRefObject<number> {
  const { phase, riseStartMs, sinkStartMs } = useTagBridgeAnimation();
  const yRef = useRef(-SINK_DEPTH);
  const sinkFromRef = useRef<number | null>(null);

  const syncYOffset = () => {
    const now = performance.now();
    if (phase === 'hidden' || phase === 'shown') {
      sinkFromRef.current = null;
      yRef.current = 0;
      return;
    }
    if (phase === 'sinking') {
      if (sinkFromRef.current === null) {
        sinkFromRef.current = riseYOffset(now - riseStartMs, plankStartMs);
      }
      yRef.current = sinkYOffsetFrom(
        sinkFromRef.current,
        now - sinkStartMs,
      );
      return;
    }
    sinkFromRef.current = null;
    yRef.current = riseYOffset(now - riseStartMs, plankStartMs);
  };

  useLayoutEffect(() => {
    syncYOffset();
  }, [phase, riseStartMs, sinkStartMs, plankStartMs]);

  useFrame(() => {
    syncYOffset();
  });

  return yRef;
}

function AnimatedPlank({
  plank,
  index,
  bKey,
  renderOrder,
}: {
  plank: PlankSpec;
  index: number;
  bKey: string;
  renderOrder: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { phase, riseStartMs, riseSchedule } = useTagBridgeAnimation();
  const { hoveredBridgeKey, hoveredPlankIndex } = useBridgeInteraction();
  const selectedBridgeKey = useWorld((s) => s.selectedTagBridgeKey);
  const plankStartMs = riseSchedule.get(plankId(bKey, index)) ?? 0;
  const yOffsetRef = useYOffsetRef(plankStartMs);
  const restY = plank.position.y;

  const isBridgeHovered = hoveredBridgeKey === bKey;
  const isBridgeSelected = selectedBridgeKey === bKey;
  const isPlankHovered = isBridgeHovered && hoveredPlankIndex === index;
  const emphasize = isBridgeHovered || isBridgeSelected;
  const interactionLift =
    (isBridgeSelected ? SELECTED_BRIDGE_LIFT : 0) +
    (isPlankHovered ? HOVER_PLANK_LIFT : 0);

  const applyPosition = () => {
    if (!meshRef.current) return;
    meshRef.current.position.set(
      plank.position.x,
      restY + yOffsetRef.current + interactionLift,
      plank.position.z,
    );
  };

  useLayoutEffect(() => {
    applyPosition();
  }, [
    phase,
    riseStartMs,
    plankStartMs,
    restY,
    interactionLift,
  ]);

  useFrame(applyPosition);

  const initialYOffset =
    phase === 'rising'
      ? riseYOffset(performance.now() - riseStartMs, plankStartMs)
      : 0;

  return (
    <mesh
      ref={meshRef}
      position={[
        plank.position.x,
        restY + initialYOffset + interactionLift,
        plank.position.z,
      ]}
      rotation={plank.rotation}
      geometry={getPlankGeometry(plank.geometrySeed)}
      renderOrder={renderOrder}
      raycast={() => null}
    >
      <meshStandardMaterial
        color={plank.color}
        roughness={0.92}
        metalness={0.02}
        emissive={emphasize ? plank.color : '#000000'}
        emissiveIntensity={emphasize ? BRIDGE_EMISSIVE : 0}
        depthWrite={renderOrder === 1}
        polygonOffset
        polygonOffsetFactor={-renderOrder}
        polygonOffsetUnits={-renderOrder}
      />
    </mesh>
  );
}

function StringerSegment({
  a,
  b,
  color,
  baseY,
  renderOrder,
  yOffsetRef,
  emphasized,
}: {
  a: THREE.Vector3;
  b: THREE.Vector3;
  color: string;
  baseY: number;
  renderOrder: number;
  yOffsetRef: MutableRefObject<number>;
  emphasized: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const mid = useMemo(
    () => a.clone().add(b).multiplyScalar(0.5),
    [a, b],
  );
  const len = useMemo(() => a.distanceTo(b), [a, b]);
  const yaw = useMemo(() => Math.atan2(b.x - a.x, b.z - a.z), [a, b]);

  const applyY = () => {
    if (!meshRef.current) return;
    meshRef.current.position.y = baseY + yOffsetRef.current;
  };

  useLayoutEffect(applyY);

  useFrame(applyY);

  return (
    <mesh
      ref={meshRef}
      position={[mid.x, baseY + yOffsetRef.current, mid.z]}
      rotation={[0, yaw, 0]}
      renderOrder={renderOrder}
    >
      <boxGeometry args={[0.09, 0.07, len * 1.02]} />
      <meshStandardMaterial
        color={color}
        roughness={0.95}
        metalness={0.01}
        emissive={emphasized ? color : '#000000'}
        emissiveIntensity={emphasized ? BRIDGE_EMISSIVE * 0.7 : 0}
        polygonOffset
        polygonOffsetFactor={-renderOrder}
      />
    </mesh>
  );
}

function StringerMesh({
  points,
  color,
  yLift,
  renderOrder,
  yOffsetRef,
  emphasized,
}: {
  points: THREE.Vector3[];
  color: string;
  yLift: number;
  renderOrder: number;
  yOffsetRef: MutableRefObject<number>;
  emphasized: boolean;
}) {
  const baseY = BASE_Y + 0.02 + yLift;

  return (
    <group>
      {points.slice(0, -1).map((a, i) => (
        <StringerSegment
          key={i}
          a={a}
          b={points[i + 1]}
          color={color}
          baseY={baseY}
          renderOrder={renderOrder}
          yOffsetRef={yOffsetRef}
          emphasized={emphasized}
        />
      ))}
    </group>
  );
}

function AnimatedPiling({
  position,
  height,
  renderOrder,
  yOffsetRef,
  emphasized,
}: {
  position: [number, number, number];
  height: number;
  renderOrder: number;
  yOffsetRef: MutableRefObject<number>;
  emphasized: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const restY = position[1] + height / 2;

  const applyY = () => {
    if (!meshRef.current) return;
    meshRef.current.position.y = restY + yOffsetRef.current;
  };

  useLayoutEffect(applyY);

  useFrame(applyY);

  return (
    <mesh
      ref={meshRef}
      position={[position[0], restY + yOffsetRef.current, position[2]]}
      renderOrder={renderOrder}
    >
      <boxGeometry args={[0.1, height, 0.1]} />
      <meshStandardMaterial
        color={WOOD_DARK}
        roughness={1}
        emissive={emphasized ? '#8a6a42' : '#000000'}
        emissiveIntensity={emphasized ? 0.08 : 0}
      />
    </mesh>
  );
}

function BridgeDeckHitArea({
  spec,
  bKey,
  yOffsetRef,
}: {
  spec: BridgeMeshSpec;
  bKey: string;
  yOffsetRef: MutableRefObject<number>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { interactive, setHover } = useBridgeInteraction();
  const selectedBridgeKey = useWorld((s) => s.selectedTagBridgeKey);
  const selectTagBridge = useWorld((s) => s.selectTagBridge);
  const { renderOrder, planks, deckHitGeometry } = spec;

  const applyY = () => {
    if (!meshRef.current) return;
    meshRef.current.position.y = yOffsetRef.current;
  };

  useLayoutEffect(applyY);
  useFrame(applyY);

  const pickPlank = (point: THREE.Vector3) =>
    pickPlankIndexAtPoint(planks, point);

  const pointerHandlers = interactive
    ? {
        onPointerOver: (e: THREE.Event & { point: THREE.Vector3 }) => {
          e.stopPropagation();
          const index = pickPlank(e.point);
          setHover(bKey, index);
          document.body.style.cursor = 'pointer';
        },
        onPointerMove: (e: THREE.Event & { point: THREE.Vector3 }) => {
          e.stopPropagation();
          setHover(bKey, pickPlank(e.point));
        },
        onPointerOut: (e: THREE.Event) => {
          e.stopPropagation();
          setHover(null, null);
          document.body.style.cursor = '';
        },
        onClick: (e: THREE.Event) => {
          e.stopPropagation();
          selectTagBridge(selectedBridgeKey === bKey ? null : bKey);
        },
      }
    : {};

  return (
    <mesh
      ref={meshRef}
      geometry={deckHitGeometry}
      renderOrder={renderOrder + 8}
      {...pointerHandlers}
    >
      <meshBasicMaterial
        transparent
        opacity={0}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

function TagBridgeMesh({
  spec,
  bKey,
}: {
  spec: BridgeMeshSpec;
  bKey: string;
}) {
  const { renderOrder, yLift, planks } = spec;
  const { riseSchedule } = useTagBridgeAnimation();
  const { hoveredBridgeKey } = useBridgeInteraction();
  const selectedBridgeKey = useWorld((s) => s.selectedTagBridgeKey);
  const bridgeRiseStartMs = useMemo(
    () => getBridgeRiseStartMs(bKey, planks.length, riseSchedule),
    [bKey, planks.length, riseSchedule],
  );
  const yOffsetRef = useYOffsetRef(bridgeRiseStartMs);
  const emphasized =
    hoveredBridgeKey === bKey || selectedBridgeKey === bKey;

  return (
    <group>
      <BridgeDeckHitArea spec={spec} bKey={bKey} yOffsetRef={yOffsetRef} />

      {spec.pilings.map((p, i) => (
        <AnimatedPiling
          key={`p-${i}`}
          position={p.position}
          height={p.height}
          renderOrder={renderOrder - 1}
          yOffsetRef={yOffsetRef}
          emphasized={emphasized}
        />
      ))}

      {spec.stringers.map((s, i) => (
        <StringerMesh
          key={`s-${i}`}
          points={s.points}
          color={s.color}
          yLift={yLift}
          renderOrder={renderOrder}
          yOffsetRef={yOffsetRef}
          emphasized={emphasized}
        />
      ))}

      {spec.planks.map((plank, i) => (
        <AnimatedPlank
          key={`pl-${i}`}
          plank={plank}
          index={i}
          bKey={bKey}
          renderOrder={renderOrder}
        />
      ))}
    </group>
  );
}

function TagBridge({
  placement,
}: {
  placement: BridgePlacement;
}) {
  const bKey = bridgeKey(placement.bridge);

  const spec = useMemo(
    () => buildBridgeMeshSpec(placement.bridge, placement),
    [placement],
  );

  return <TagBridgeMesh spec={spec} bKey={bKey} />;
}

export default function TagBridgePaths({
  bridges,
  bridgePlacements,
  visible,
}: Props) {
  const selectTagBridge = useWorld((s) => s.selectTagBridge);
  const placementsByKey = useMemo(() => {
    const m = new Map<string, BridgePlacement>();
    for (const p of bridgePlacements) {
      m.set(bridgeKey(p.bridge), p);
    }
    return m;
  }, [bridgePlacements]);

  const ordered = useMemo(
    () => [...bridges].sort((a, b) => a.priority - b.priority),
    [bridges],
  );

  const [phase, setPhase] = useState<TagBridgeAnimPhase>('hidden');
  const [riseSchedule, setRiseSchedule] = useState<Map<string, number>>(
    () => new Map(),
  );
  const [riseStartMs, setRiseStartMs] = useState(0);
  const [sinkStartMs, setSinkStartMs] = useState(0);
  const [hasActivated, setHasActivated] = useState(false);
  const [hoveredBridgeKey, setHoveredBridgeKey] = useState<string | null>(null);
  const [hoveredPlankIndex, setHoveredPlankIndex] = useState<number | null>(
    null,
  );
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const setHover = useCallback(
    (bridgeKey: string | null, plankIndex: number | null) => {
      setHoveredBridgeKey(bridgeKey);
      setHoveredPlankIndex(plankIndex);
    },
    [],
  );

  useEffect(() => {
    if (visible) {
      setHasActivated(true);
      const schedule = computeRiseSchedule(bridgePlacements);
      setRiseSchedule(schedule);
      setRiseStartMs(performance.now());
      setPhase('rising');
      return;
    }

    setHover(null, null);
    selectTagBridge(null);

    if (phaseRef.current === 'rising' || phaseRef.current === 'shown') {
      setSinkStartMs(performance.now());
      setPhase('sinking');
    }
  }, [visible, bridgePlacements, setHover, selectTagBridge]);

  useFrame(() => {
    const now = performance.now();
    if (phaseRef.current === 'rising') {
      const endMs = computeRiseEndMs(riseSchedule);
      if (endMs === 0 || now - riseStartMs >= endMs) {
        setPhase('shown');
      }
    }
    if (phaseRef.current === 'sinking' && now - sinkStartMs >= SINK_DURATION_MS) {
      setPhase('hidden');
    }
  });

  const animValue = useMemo<AnimContextValue>(
    () => ({
      phase,
      riseSchedule,
      riseStartMs,
      sinkStartMs,
    }),
    [phase, riseSchedule, riseStartMs, sinkStartMs],
  );

  const interactionValue = useMemo<BridgeInteractionValue>(
    () => ({
      hoveredBridgeKey,
      hoveredPlankIndex,
      interactive: phase === 'shown',
      setHover,
    }),
    [hoveredBridgeKey, hoveredPlankIndex, phase, setHover],
  );

  if (!hasActivated && phase === 'hidden') return null;
  if (phase === 'hidden') return null;

  return (
    <TagBridgeAnimationContext.Provider value={animValue}>
      <BridgeInteractionContext.Provider value={interactionValue}>
        <group>
          {ordered.map((bridge) => {
            const placement = placementsByKey.get(bridgeKey(bridge));
            if (!placement) return null;
            return (
              <TagBridge
                key={`${bridge.sourceId}:${bridge.targetId}`}
                placement={placement}
              />
            );
          })}
        </group>
      </BridgeInteractionContext.Provider>
    </TagBridgeAnimationContext.Provider>
  );
}
