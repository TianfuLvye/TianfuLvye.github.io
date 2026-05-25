import type { ContinentData, ViewState } from '../lib/types';

interface Props {
  view: ViewState;
  continent: ContinentData | null;
  onBack: () => void;
}

export default function HUD({ view, continent, onBack }: Props) {
  return (
    <header className="hud">
      <div className="hud-brand">
        <span className="hud-glyph">⌖</span>
        <span className="hud-title">An atlas of notes</span>
      </div>

      <nav className="hud-crumbs">
        <button
          className={`crumb ${view.kind === 'globe' ? 'is-current' : ''}`}
          onClick={onBack}
          disabled={view.kind === 'globe'}
        >
          the globe
        </button>
        {view.kind === 'map' && continent && (
          <>
            <span className="crumb-sep">/</span>
            <span className="crumb is-current">{continent.label}</span>
          </>
        )}
      </nav>

      <div className="hud-help">
        {view.kind === 'globe' ? (
          <>drag · click a land · double-click to land on it</>
        ) : (
          <>click a building · double-click to open · drag to pan</>
        )}
      </div>
    </header>
  );
}
