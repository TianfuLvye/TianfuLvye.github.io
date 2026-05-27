import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LIB_DIR = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path to `src/content/notes` (stable during Astro build). */
export const NOTES_CONTENT_ROOT = path.resolve(LIB_DIR, '../content/notes');

/** `src/content/notes` — content collection root folder name */
export const NOTES_COLLECTION_FOLDER = 'notes';

/** Shared asset folder; not a continent on the world map */
export const ATTACHMENTS_FOLDER = 'attachments';

export const RESERVED_NOTE_FOLDERS = new Set<string>([ATTACHMENTS_FOLDER]);

export function sharedAttachmentsDir(
  notesRoot: string = NOTES_CONTENT_ROOT,
): string {
  return path.join(notesRoot, ATTACHMENTS_FOLDER);
}

/** Locate `.../src/content/notes` from a markdown file directory (fallback). */
export function findNotesContentRoot(fromDir: string): string | null {
  let current = fromDir;
  while (current !== path.dirname(current)) {
    if (path.basename(current) === NOTES_COLLECTION_FOLDER) {
      if (path.basename(path.dirname(current)) === 'content') {
        return current;
      }
      if (fs.existsSync(path.join(current, ATTACHMENTS_FOLDER))) {
        return current;
      }
    }
    current = path.dirname(current);
  }
  return null;
}
