import type { NoteData, SortKey } from './types';

/**
 * 笔记排序比较器。MapView(决定漂浮顺序)与 Sidebar(文件列表顺序)原本各写一份
 * 完全相同的 size/date/name switch,这里收敛为单一来源。
 *
 * 'default' 返回恒等比较(始终 0):配合稳定排序即"保持原有顺序",与两处旧行为一致。
 */
export function compareNotes(
  key: SortKey,
): (a: NoteData, b: NoteData) => number {
  switch (key) {
    case 'size':
      return (a, b) => b.size - a.size;
    case 'date':
      return (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime();
    case 'name':
      return (a, b) => a.title.localeCompare(b.title);
    default:
      return () => 0;
  }
}
