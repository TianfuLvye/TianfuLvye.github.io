import type { CollectionEntry } from 'astro:content';
import type { ContinentData, NoteData, WorldTree } from './types';

function prettify(folder: string): string {
  return folder.charAt(0).toUpperCase() + folder.slice(1);
}

/**
 * 把 content collection 的 entry 列表，按"第一层文件夹"分组成 WorldTree。
 * 文件 id 形如 "travel/kyoto-rain"，分隔出 continentId="travel"。
 */
export function buildWorldTree(entries: CollectionEntry<'notes'>[]): WorldTree {
  const groups = new Map<string, NoteData[]>();

  for (const entry of entries) {
    const parts = entry.id.split('/');
    if (parts.length < 2) continue; // 顶层文件，跳过
    const continentId = parts[0];

    const body = entry.body ?? '';
    const note: NoteData = {
      id: entry.id,
      slug: entry.id,
      title: entry.data.title,
      size: body.length,
      date: entry.data.date.toISOString(),
      summary: entry.data.summary,
      tags: entry.data.tags ?? [],
      continentId,
    };

    if (!groups.has(continentId)) groups.set(continentId, []);
    groups.get(continentId)!.push(note);
  }

  const continents: ContinentData[] = [];
  for (const [id, notes] of groups) {
    const totalSize = notes.reduce((a, n) => a + n.size, 0);
    notes.sort((a, b) => a.id.localeCompare(b.id));
    continents.push({ id, label: prettify(id), notes, totalSize });
  }
  continents.sort((a, b) => a.id.localeCompare(b.id));
  return continents;
}
