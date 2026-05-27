import { create } from 'zustand';
import type { NoteData, SortKey, ViewState } from './lib/types';

interface WorldStore {
  view: ViewState;
  /** 当前在 details panel 里显示的 note */
  selectedNote: NoteData | null;
  /** 在 globe 视图里悬停/点击高亮的 continent */
  focusedContinent: string | null;
  /** 在 map 视图里悬停的 note id（左侧 sidebar hover 联动） */
  hoveredNoteId: string | null;
  /** map 视图的 sort_by 模式 */
  sortKey: SortKey;
  /** 云朵转场是否正在进行 */
  transitioning: boolean;
  /** 是否显示 tag 木板路 */
  showTagPaths: boolean;

  enterMap: (continentId: string) => void;
  exitToGlobe: () => void;
  focusContinent: (id: string | null) => void;
  selectNote: (note: NoteData | null) => void;
  hoverNote: (id: string | null) => void;
  setSort: (k: SortKey) => void;
  setTransitioning: (t: boolean) => void;
  setShowTagPaths: (v: boolean) => void;
}

export const useWorld = create<WorldStore>((set) => ({
  view: { kind: 'globe' },
  selectedNote: null,
  focusedContinent: null,
  hoveredNoteId: null,
  sortKey: 'default',
  transitioning: false,
  showTagPaths: false,

  enterMap: (continentId) =>
    set({
      view: { kind: 'map', continentId },
      selectedNote: null,
      hoveredNoteId: null,
      sortKey: 'default',
      focusedContinent: null,
      showTagPaths: false,
    }),
  exitToGlobe: () =>
    set({
      view: { kind: 'globe' },
      selectedNote: null,
      hoveredNoteId: null,
      sortKey: 'default',
      showTagPaths: false,
    }),
  focusContinent: (id) => set({ focusedContinent: id }),
  selectNote: (note) => set({ selectedNote: note }),
  hoverNote: (id) => set({ hoveredNoteId: id }),
  setSort: (k) => set({ sortKey: k }),
  setTransitioning: (t) => set({ transitioning: t }),
  setShowTagPaths: (v) => set({ showTagPaths: v }),
}));
