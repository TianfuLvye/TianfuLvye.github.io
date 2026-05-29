import { useCallback, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import type { NoteData, WorldTree } from '../lib/types';
import { useWorld } from '../store';
import Globe from './Globe';
import MapView from './MapView';
import CloudTransition from './CloudTransition';
import DetailsPanel from './DetailsPanel';
import Sidebar from './Sidebar';
import BridgeTagInfoDock from './BridgeTagInfoDock';
import GridDebugToggle from './GridDebugToggle';
import HUD from './HUD';

interface Props {
  tree: WorldTree;
}

export default function World({ tree }: Props) {
  const view = useWorld((s) => s.view);
  const enterMap = useWorld((s) => s.enterMap);
  const exitToGlobe = useWorld((s) => s.exitToGlobe);
  const selectedNote = useWorld((s) => s.selectedNote);
  const selectNote = useWorld((s) => s.selectNote);
  const transitioning = useWorld((s) => s.transitioning);
  const setTransitioning = useWorld((s) => s.setTransitioning);

  /** 由 globe 触发的待进入大陆 id（在云朵中点时实际切换） */
  const [pendingContinent, setPendingContinent] = useState<string | null>(null);

  const handleEnterContinent = useCallback(
    (continentId: string) => {
      setPendingContinent(continentId);
      setTransitioning(true);
    },
    [setTransitioning],
  );

  const handleBack = useCallback(() => {
    if (view.kind === 'globe') return;
    setPendingContinent(null);
    setTransitioning(true);
  }, [view.kind, setTransitioning]);

  const handleTransitionMid = useCallback(() => {
    if (pendingContinent) {
      enterMap(pendingContinent);
    } else {
      exitToGlobe();
    }
  }, [pendingContinent, enterMap, exitToGlobe]);

  const handleTransitionDone = useCallback(() => {
    setTransitioning(false);
    setPendingContinent(null);
  }, [setTransitioning]);

  const openNote = useCallback((note: NoteData) => {
    window.location.href = `/notes/${note.slug}`;
  }, []);

  // 从笔记页「back to continent」进入时恢复大陆视图
  useEffect(() => {
    const continent = new URLSearchParams(window.location.search).get('continent');
    if (!continent || !tree.some((c) => c.id === continent)) return;
    enterMap(continent);
    window.history.replaceState({}, '', '/');
  }, [tree, enterMap]);

  // ESC 返回 globe
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (selectedNote) selectNote(null);
        else if (view.kind === 'map' && !transitioning) handleBack();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view.kind, selectedNote, selectNote, transitioning, handleBack]);

  const currentContinent =
    view.kind === 'map'
      ? tree.find((c) => c.id === view.continentId) ?? null
      : null;

  return (
    <div className="world-root">
      <Canvas
        shadows
        gl={{ antialias: true, alpha: false }}
        camera={{ position: [0, 0, 7], fov: 45 }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#0b1426']} />
        {view.kind === 'globe' && (
          <Globe tree={tree} onEnter={handleEnterContinent} />
        )}
        {view.kind === 'map' && currentContinent && (
          <MapView continent={currentContinent} onOpenNote={openNote} />
        )}
      </Canvas>

      <HUD
        view={view}
        continent={currentContinent}
        onBack={handleBack}
      />

      {view.kind === 'map' && currentContinent && (
        <Sidebar
          continent={currentContinent}
          onPick={(n) => selectNote(n)}
        />
      )}

      {view.kind === 'map' && currentContinent && (
        <BridgeTagInfoDock continent={currentContinent} />
      )}

      {view.kind === 'map' && currentContinent && <GridDebugToggle />}

      <DetailsPanel
        note={selectedNote}
        onClose={() => selectNote(null)}
        onOpen={openNote}
      />

      <CloudTransition
        active={transitioning}
        onMidpoint={handleTransitionMid}
        onComplete={handleTransitionDone}
      />
    </div>
  );
}
