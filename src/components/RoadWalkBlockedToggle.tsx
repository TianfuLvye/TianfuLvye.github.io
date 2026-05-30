import { useWorld } from '../store';

export default function RoadWalkBlockedToggle() {
  const showRoadWalkBlockedDebug = useWorld((s) => s.showRoadWalkBlockedDebug);
  const setShowRoadWalkBlockedDebug = useWorld(
    (s) => s.setShowRoadWalkBlockedDebug,
  );

  return (
    <button
      type="button"
      className={`road-walk-blocked-toggle ${showRoadWalkBlockedDebug ? 'is-active' : ''}`}
      onClick={() => setShowRoadWalkBlockedDebug(!showRoadWalkBlockedDebug)}
      title="Toggle road walk-blocked overlay (footprints + door flanks)"
      aria-pressed={showRoadWalkBlockedDebug}
    >
      ⊠ blocked
    </button>
  );
}
