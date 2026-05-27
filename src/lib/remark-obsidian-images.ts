import fs from 'node:fs';
import path from 'node:path';
import type { Image, PhrasingContent, Root, Text } from 'mdast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import {
  NOTES_CONTENT_ROOT,
  sharedAttachmentsDir,
} from './content-paths';

/** Obsidian embed: ![[file.jpg]] or ![[file.jpg|alt text]] or ![[file.jpg|300]] (width in px) */
const OBSIDIAN_IMAGE_RE = /!\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g;

const PIPE_WIDTH_RE = /^\d+(\.\d+)?$/;

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif'];

/** Static placeholder when a local attachment is missing (place file at public/images/image-missing.png). */
export const MISSING_IMAGE_SRC = '/images/image-missing.png';

function toPosixRelative(fromDir: string, absolute: string): string {
  const rel = path.relative(fromDir, absolute);
  const posix = rel.split(path.sep).join('/');
  return posix.startsWith('.') ? posix : `./${posix}`;
}

function resolveImageUrl(markdownDir: string, target: string): string | null {
  const trimmed = target.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const attachmentsDir = sharedAttachmentsDir(NOTES_CONTENT_ROOT);

  const candidates: string[] = [];
  const add = (abs: string) => {
    if (!candidates.includes(abs)) candidates.push(abs);
  };

  add(path.join(attachmentsDir, trimmed));
  if (!path.extname(trimmed)) {
    for (const ext of IMAGE_EXTENSIONS) {
      add(path.join(attachmentsDir, trimmed + ext));
    }
  }

  for (const abs of candidates) {
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
      return toPosixRelative(markdownDir, abs);
    }
  }

  return null;
}

function parsePipe(
  pipe: string | undefined,
  target: string,
): { alt: string; widthPx?: number } {
  const p = pipe?.trim();
  if (!p) {
    return { alt: path.basename(target, path.extname(target)) };
  }
  if (PIPE_WIDTH_RE.test(p)) {
    const widthPx = Number(p);
    return {
      alt: path.basename(target, path.extname(target)),
      widthPx: widthPx > 0 ? widthPx : undefined,
    };
  }
  return { alt: p };
}

function buildImageNode(url: string, alt: string, widthPx?: number): Image {
  const node: Image = {
    type: 'image',
    url,
    alt,
    title: null,
  };
  if (widthPx != null) {
    node.data = {
      hProperties: {
        style: `width:${widthPx}px;max-width:100%;height:auto;`,
      },
    };
  }
  return node;
}

function warnMissingImage(
  notePath: string | undefined,
  target: string,
  attachmentsDir: string,
): void {
  const note = notePath
    ? path.relative(process.cwd(), notePath)
    : '(unknown note)';
  console.warn(
    `[remark-obsidian-images] Missing image ![[${target.trim()}]] in ${note}\n` +
      `  Place the file in: ${attachmentsDir}`,
  );
}

function expandObsidianImages(
  text: string,
  markdownDir: string,
  notePath: string | undefined,
): PhrasingContent[] | null {
  OBSIDIAN_IMAGE_RE.lastIndex = 0;
  if (!OBSIDIAN_IMAGE_RE.test(text)) return null;

  OBSIDIAN_IMAGE_RE.lastIndex = 0;
  const nodes: PhrasingContent[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const attachmentsDir = sharedAttachmentsDir(NOTES_CONTENT_ROOT);

  while ((match = OBSIDIAN_IMAGE_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    const target = match[1];
    const { alt, widthPx } = parsePipe(match[2], target);
    const url = resolveImageUrl(markdownDir, target);

    if (url) {
      nodes.push(buildImageNode(url, alt, widthPx));
    } else {
      warnMissingImage(notePath, target, attachmentsDir);
      nodes.push(
        buildImageNode(MISSING_IMAGE_SRC, `Missing image: ${target.trim()}`, widthPx),
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return nodes.length > 0 ? nodes : null;
}

/**
 * Turn Obsidian image embeds `![[file name.jpg]]` into standard mdast images.
 * Files resolve from `src/content/notes/attachments/` (shared across all notes).
 * Missing local files render as a placeholder and log a build warning.
 * A numeric pipe value sets width in pixels, e.g. `![[photo.png|150]]`.
 */
export const remarkObsidianImages: Plugin<[], Root> = () => (tree, file) => {
  const markdownDir = file.path
    ? path.dirname(file.path)
    : (file.dirname ?? process.cwd());

  visit(tree, 'text', (node: Text, index, parent) => {
    if (parent == null || index == null) return;
    const expanded = expandObsidianImages(node.value, markdownDir, file.path);
    if (!expanded) return;
    (parent.children as PhrasingContent[]).splice(index, 1, ...expanded);
  });
};
