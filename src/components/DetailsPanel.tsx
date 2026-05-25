import type { NoteData } from '../lib/types';

interface Props {
  note: NoteData | null;
  onClose: () => void;
  onOpen: (note: NoteData) => void;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(1)} KB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function DetailsPanel({ note, onClose, onOpen }: Props) {
  return (
    <aside className={`details-panel ${note ? 'is-open' : ''}`}>
      {note && (
        <>
          <header className="details-header">
            <span className="details-eyebrow">{note.continentId}</span>
            <button className="details-close" onClick={onClose} aria-label="close">
              ×
            </button>
          </header>
          <h2 className="details-title">{note.title}</h2>
          <dl className="details-meta">
            <div>
              <dt>date</dt>
              <dd>{formatDate(note.date)}</dd>
            </div>
            <div>
              <dt>size</dt>
              <dd>{formatBytes(note.size)}</dd>
            </div>
            {note.tags.length > 0 && (
              <div>
                <dt>tags</dt>
                <dd>{note.tags.join(' · ')}</dd>
              </div>
            )}
          </dl>
          {note.summary && <p className="details-summary">{note.summary}</p>}
          <button className="details-open" onClick={() => onOpen(note)}>
            Open the note →
          </button>
          <div className="details-hint">double-click building also works</div>
        </>
      )}
    </aside>
  );
}
