import { create } from 'zustand';
import {
  DEFAULT_ROAD_DEBUG,
  type RoadDebugSettings,
} from './lib/road-debug';
import type { NoteData, SortKey, ViewState } from './lib/types';

interface WorldStore {
  view: ViewState;
  /** 当前在 details panel 里显示的 note */
  selectedNote: NoteData | null;
  /** 在 globe 视图里悬停/点击高亮的 continent */
  focusedContinent: string | null;
  /** 在 map 视图里高亮的 note id（sidebar、tag 面板等） */
  hoveredNoteIds: string[];
  /** 当前激活的 tag（多选马路图层） */
  activeTags: string[];
  /** map 视图的 sort_by 模式 */
  sortKey: SortKey;
  /** 云朵转场是否正在进行 */
  transitioning: boolean;
  /** 是否显示地图网格调试线 */
  showGridDebug: boolean;
  /** 马路 GLB 调试参数 */
  roadDebug: RoadDebugSettings;
  /** 是否显示马路调试面板 */
  showRoadDebugPanel: boolean;

  enterMap: (continentId: string) => void;
  exitToGlobe: () => void;
  focusContinent: (id: string | null) => void;
  selectNote: (note: NoteData | null) => void;
  hoverNote: (id: string | null) => void;
  hoverNotes: (ids: string[]) => void;
  toggleTag: (tag: string) => void;
  clearActiveTags: () => void;
  setSort: (k: SortKey) => void;
  setTransitioning: (t: boolean) => void;
  setShowGridDebug: (v: boolean) => void;
  setRoadDebug: (next: RoadDebugSettings) => void;
  resetRoadDebug: () => void;
  setShowRoadDebugPanel: (v: boolean) => void;
}

export const useWorld = create<WorldStore>((set) => ({
  view: { kind: 'globe' },
  selectedNote: null,
  focusedContinent: null,
  hoveredNoteIds: [],
  activeTags: [],
  sortKey: 'default',
  transitioning: false,
  showGridDebug: false,
  roadDebug: DEFAULT_ROAD_DEBUG,
  showRoadDebugPanel: true,

  enterMap: (continentId) =>
    set({
      view: { kind: 'map', continentId },
      selectedNote: null,
      hoveredNoteIds: [],
      activeTags: [],
      sortKey: 'default',
      focusedContinent: null,
      showGridDebug: false,
    }),
  exitToGlobe: () =>
    set({
      view: { kind: 'globe' },
      selectedNote: null,
      hoveredNoteIds: [],
      activeTags: [],
      sortKey: 'default',
      showGridDebug: false,
    }),
  focusContinent: (id) => set({ focusedContinent: id }),
  selectNote: (note) => set({ selectedNote: note }),
  hoverNote: (id) => set({ hoveredNoteIds: id ? [id] : [] }),
  hoverNotes: (ids) => set({ hoveredNoteIds: ids }),
  toggleTag: (tag) =>
    set((s) => ({
      activeTags: s.activeTags.includes(tag)
        ? s.activeTags.filter((t) => t !== tag)
        : [...s.activeTags, tag],
    })),
  clearActiveTags: () => set({ activeTags: [] }),
  setSort: (k) => set({ sortKey: k }),
  setTransitioning: (t) => set({ transitioning: t }),
  setShowGridDebug: (v) => set({ showGridDebug: v }),
  setRoadDebug: (next) => set({ roadDebug: next }),
  resetRoadDebug: () => set({ roadDebug: DEFAULT_ROAD_DEBUG }),
  setShowRoadDebugPanel: (v) => set({ showRoadDebugPanel: v }),
}));
