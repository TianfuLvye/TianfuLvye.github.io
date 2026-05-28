import { useMemo } from 'react';
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
  const showTagPaths = useWorld((s) => s.showTagPaths);
  const setShowTagPaths = useWorld((s) => s.setShowTagPaths);
  const hoveredNoteIds = useWorld((s) => s.hoveredNoteIds);
  const hoverNote = useWorld((s) => s.hoverNote);

  const ordered = useMemo(() => {
    const arr = [...continent.notes];
    switch (sortKey) {
      case 'size':
        arr.sort((a, b) => b.size - a.size);
        break;
      case 'date':
        arr.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
        break;
      case 'name':
        arr.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    return arr;
  }, [continent.notes, sortKey]);

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <div className="sidebar-eyebrow">continent</div>
        <h3 className="sidebar-name">{continent.label}</h3>
        <div className="sidebar-count">
          {continent.notes.length} notes ·{' '}
          {(continent.totalSize / 1024).toFixed(1)} KB
        </div>
      </div>

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

      <div className="tag-paths-row">
        <button
          className={`sort-pill ${showTagPaths ? 'is-active' : ''}`}
          onClick={() => setShowTagPaths(!showTagPaths)}
        >
          tag paths
        </button>
        {showTagPaths && (
          <span className="tag-paths-hint">plank · dual · rainbow</span>
        )}
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
            <span className="file-size">{(n.size / 1024).toFixed(1)}K</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
