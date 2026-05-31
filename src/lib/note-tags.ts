import type { NoteData } from './types';

/** 收集一组笔记里出现的全部 tag,去重并按字母排序。 */
export function collectTags(notes: NoteData[]): string[] {
  const tags = new Set<string>();
  for (const note of notes) {
    for (const tag of note.tags) tags.add(tag);
  }
  return [...tags].sort();
}
