import { useMemo } from 'react';
import { formatNoteCharCount } from '../lib/note-size';
import { collectTags } from '../lib/note-tags';
import { compareNotes } from '../lib/note-sort';
import type { ContinentData, NoteData, SortKey } from '../lib/types';
import { useWorld } from '../store';

interface Props {
  continent: ContinentData;
  onPick: (note: NoteData) => void;
}

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: 'default', label: 'as placed' },
  { key: 'size', label: 'by size' },
  { key: 'date', label: 'by date' },
  { key: 'name', label: 'by name' },
];

export default function Sidebar({ continent, onPick }: Props) {
  const sortKey = useWorld((s) => s.sortKey);
  const setSort = useWorld((s) => s.setSort);
  const hoveredNoteIds = useWorld((s) => s.hoveredNoteIds);
  const hoverNote = useWorld((s) => s.hoverNote);
  const hoverNotes = useWorld((s) => s.hoverNotes);
  const activeTags = useWorld((s) => s.activeTags);
  const toggleTag = useWorld((s) => s.toggleTag);
  const clearActiveTags = useWorld((s) => s.clearActiveTags);

  const allTags = useMemo(
    () => collectTags(continent.notes),
    [continent.notes],
  );

  const filteredNotes = useMemo(() => {
    if (activeTags.length === 0) return continent.notes;
    const active = new Set(activeTags);
    return continent.notes.filter((n) =>
      n.tags.some((t) => active.has(t)),
    );
  }, [continent.notes, activeTags]);

  const ordered = useMemo(
    () => [...filteredNotes].sort(compareNotes(sortKey)),
    [filteredNotes, sortKey],
  );

  const handleTagHover = (tag: string | null) => {
    if (!tag) {
      hoverNote(null);
      return;
    }
    const ids = continent.notes
      .filter((n) => n.tags.includes(tag))
      .map((n) => n.id);
    hoverNotes(ids);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <div className="sidebar-eyebrow">continent</div>
        <h3 className="sidebar-name">{continent.label}</h3>
        <div className="sidebar-count">
          {continent.notes.length} notes ·{' '}
          {formatNoteCharCount(continent.totalSize)}
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="tag-chip-row">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`tag-chip ${activeTags.includes(tag) ? 'is-active' : ''}`}
              onClick={() => toggleTag(tag)}
              onMouseEnter={() => handleTagHover(tag)}
              onMouseLeave={() => handleTagHover(null)}
            >
              {tag}
            </button>
          ))}
          {activeTags.length > 0 && (
            <button
              type="button"
              className="tag-chip-clear"
              onClick={clearActiveTags}
            >
              clear
            </button>
          )}
        </div>
      )}

      <div className="sort-row">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            className={`sort-pill ${sortKey === opt.key ? 'is-active' : ''}`}
            onClick={() => setSort(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <ul className="file-list">
        {ordered.map((n) => (
          <li
            key={n.id}
            className={`file-item ${hoveredNoteIds.includes(n.id) ? 'is-hover' : ''}`}
            onMouseEnter={() => hoverNote(n.id)}
            onMouseLeave={() => hoverNote(null)}
            onClick={() => onPick(n)}
            onDoubleClick={() => onPick(n)}
          >
            <span className="file-title">{n.title}</span>
            <span className="file-size">{formatNoteCharCount(n.size)}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
