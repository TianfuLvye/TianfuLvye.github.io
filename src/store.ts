import { create } from 'zustand';
import type { NoteData, SortKey, ViewState } from './lib/types';

interface WorldStore {
  view: ViewState;
  /** 当前在 details panel 里显示的 note */
  selectedNote: NoteData | null;
  /** 在 globe 视图里悬停/点击高亮的 continent */
  focusedContinent: string | null;
  /** 在 map 视图里高亮的 note id（sidebar、tag 面板等） */
  hoveredNoteIds: string[];
  /** map 视图的 sort_by 模式 */
  sortKey: SortKey;
  /** 云朵转场是否正在进行 */
  transitioning: boolean;
  /** 是否显示 tag 木板路 */
  showTagPaths: boolean;
  /** 是否显示地图网格调试线 */
  showGridDebug: boolean;
  /** 当前选中的 tag 桥（sourceId:targetId） */
  selectedTagBridgeKey: string | null;

  enterMap: (continentId: string) => void;
  exitToGlobe: () => void;
  focusContinent: (id: string | null) => void;
  selectNote: (note: NoteData | null) => void;
  hoverNote: (id: string | null) => void;
  hoverNotes: (ids: string[]) => void;
  setSort: (k: SortKey) => void;
  setTransitioning: (t: boolean) => void;
  setShowTagPaths: (v: boolean) => void;
  setShowGridDebug: (v: boolean) => void;
  selectTagBridge: (key: string | null) => void;
}

export const useWorld = create<WorldStore>((set) => ({
  view: { kind: 'globe' },
  selectedNote: null,
  focusedContinent: null,
  hoveredNoteIds: [],
  sortKey: 'default',
  transitioning: false,
  showTagPaths: false,
  showGridDebug: false,
  selectedTagBridgeKey: null,

  enterMap: (continentId) =>
    set({
      view: { kind: 'map', continentId },
      selectedNote: null,
      hoveredNoteIds: [],
      sortKey: 'default',
      focusedContinent: null,
      showTagPaths: false,
      showGridDebug: false,
      selectedTagBridgeKey: null,
    }),
  exitToGlobe: () =>
    set({
      view: { kind: 'globe' },
      selectedNote: null,
      hoveredNoteIds: [],
      sortKey: 'default',
      showTagPaths: false,
      showGridDebug: false,
      selectedTagBridgeKey: null,
    }),
  focusContinent: (id) => set({ focusedContinent: id }),
  selectNote: (note) => set({ selectedNote: note }),
  hoverNote: (id) => set({ hoveredNoteIds: id ? [id] : [] }),
  hoverNotes: (ids) => set({ hoveredNoteIds: ids }),
  setSort: (k) => set({ sortKey: k }),
  setTransitioning: (t) => set({ transitioning: t }),
  setShowTagPaths: (v) =>
    set((s) => ({
      showTagPaths: v,
      selectedTagBridgeKey: v ? s.selectedTagBridgeKey : null,
    })),
  setShowGridDebug: (v) => set({ showGridDebug: v }),
  selectTagBridge: (key) => set({ selectedTagBridgeKey: key }),
}));
