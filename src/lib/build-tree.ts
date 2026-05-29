import type { CollectionEntry } from 'astro:content';
import { RESERVED_NOTE_FOLDERS } from './content-paths';
import { MAP_SIZE } from './map-config';
import { resolveNoteDate, resolveNoteTitle } from './note-metadata';
import { placeContinentLayout } from './place-continent-layout';
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
    if (RESERVED_NOTE_FOLDERS.has(continentId)) continue;

    const body = entry.body ?? '';
    const note: NoteData = {
      id: entry.id,
      slug: entry.id,
      title: resolveNoteTitle(entry),
      size: body.length, // 正文字符数
      date: resolveNoteDate(entry).toISOString(),
      summary: entry.data.summary,
      tags: entry.data.tags ?? [],
      continentId,
      building: entry.data.building,
    };

    if (!groups.has(continentId)) groups.set(continentId, []);
    groups.get(continentId)!.push(note);
  }

  const continents: ContinentData[] = [];
  for (const [id, notes] of groups) {
    const totalSize = notes.reduce((a, n) => a + n.size, 0);
    notes.sort((a, b) => a.id.localeCompare(b.id));
    const { tagBridges } = placeContinentLayout(notes, MAP_SIZE);
    continents.push({
      id,
      label: prettify(id),
      notes,
      totalSize,
      tagBridges,
    });
  }
  continents.sort((a, b) => a.id.localeCompare(b.id));
  return continents;
}
