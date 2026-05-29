import { useWorld } from '../store';

export default function GridDebugToggle() {
  const showGridDebug = useWorld((s) => s.showGridDebug);
  const setShowGridDebug = useWorld((s) => s.setShowGridDebug);

  return (
    <button
      type="button"
      className={`grid-debug-toggle ${showGridDebug ? 'is-active' : ''}`}
      onClick={() => setShowGridDebug(!showGridDebug)}
      title="Toggle grid overlay"
      aria-pressed={showGridDebug}
    >
      ⊞ grid
    </button>
  );
}
