import fs from 'node:fs';
import path from 'node:path';
import type { Image, PhrasingContent, Root, RootContent, Text } from 'mdast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import {
  NOTES_CONTENT_ROOT,
  sharedAttachmentsDir,
} from './content-paths';

/** Obsidian embed: ![[file.jpg]] or ![[file.jpg|alt]] or ![[file.jpg|300]] (width px) */
const OBSIDIAN_EMBED_RE = /!\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g;

const PIPE_WIDTH_RE = /^\d+(\.\d+)?$/;
const PDF_HEIGHT_RE = /^height=(\d+(?:\.\d+)?)$/i;

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif'];
const PDF_EXTENSION = '.pdf';

export const MISSING_IMAGE_SRC = '/images/image-missing.png';

function toPosixRelative(fromDir: string, absolute: string): string {
  const rel = path.relative(fromDir, absolute);
  const posix = rel.split(path.sep).join('/');
  return posix.startsWith('.') ? posix : `./${posix}`;
}

function splitTarget(raw: string): { filePart: string; fragment: string | null } {
  const hashIdx = raw.indexOf('#');
  if (hashIdx === -1) return { filePart: raw.trim(), fragment: null };
  return {
    filePart: raw.slice(0, hashIdx).trim(),
    fragment: raw.slice(hashIdx + 1).trim() || null,
  };
}

function attachmentBasename(filePart: string): string {
  const normalized = filePart.replace(/\\/g, '/');
  const m = normalized.match(/(?:^|\/)(?:\.\.\/)*attachments\/(.+)$/i);
  return m ? m[1] : path.basename(filePart);
}

function resolveEmbedFile(
  markdownDir: string,
  filePart: string,
): { absolute: string; kind: 'image' | 'pdf' } | null {
  const attachmentsDir = sharedAttachmentsDir(NOTES_CONTENT_ROOT);
  const baseName = attachmentBasename(filePart);
  const ext = path.extname(baseName).toLowerCase();
  const isPdf = ext === PDF_EXTENSION;

  const candidates: string[] = [];
  const add = (abs: string) => {
    const resolved = path.normalize(abs);
    if (!candidates.includes(resolved)) candidates.push(resolved);
  };

  add(path.resolve(markdownDir, filePart));
  add(path.join(attachmentsDir, filePart));
  add(path.join(attachmentsDir, baseName));

  if (!ext) {
    const exts = isPdf ? [PDF_EXTENSION] : IMAGE_EXTENSIONS;
    for (const tryExt of exts) {
      add(path.join(attachmentsDir, baseName + tryExt));
    }
  }

  for (const abs of candidates) {
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
      const kind = path.extname(abs).toLowerCase() === PDF_EXTENSION ? 'pdf' : 'image';
      return { absolute: abs, kind };
    }
  }

  return null;
}

function toPublicAttachmentUrl(absolute: string): string {
  const attachmentsDir = sharedAttachmentsDir(NOTES_CONTENT_ROOT);
  const rel = path.relative(attachmentsDir, absolute);
  const posix = rel.split(path.sep).join('/');
  return `/notes-attachments/${encodeURI(posix)}`;
}

function resolveEmbedUrl(markdownDir: string, rawTarget: string): {
  url: string;
  kind: 'image' | 'pdf';
} | null {
  const trimmed = rawTarget.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    const kind = trimmed.toLowerCase().includes('.pdf') ? 'pdf' : 'image';
    return { url: trimmed, kind };
  }

  const { filePart } = splitTarget(trimmed);
  const resolved = resolveEmbedFile(markdownDir, filePart);
  if (!resolved) return null;

  if (resolved.kind === 'pdf') {
    return { url: toPublicAttachmentUrl(resolved.absolute), kind: 'pdf' };
  }

  return {
    url: toPosixRelative(markdownDir, resolved.absolute),
    kind: 'image',
  };
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

function parsePdfHeight(fragment: string | null): number | undefined {
  if (!fragment) return undefined;
  const m = fragment.match(PDF_HEIGHT_RE);
  if (!m) return undefined;
  const h = Number(m[1]);
  return h > 0 ? h : undefined;
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

function buildPdfNode(url: string, title: string, heightPx?: number): RootContent {
  const height = heightPx ?? 480;
  const safeTitle = title.replace(/"/g, '&quot;');
  return {
    type: 'html',
    value:
      `<div class="note-pdf-embed">` +
      `<embed src="${url}" type="application/pdf" title="${safeTitle}" ` +
      `height="${height}" class="note-pdf-embed__frame" />` +
      `<a class="note-pdf-embed__link" href="${url}" target="_blank" rel="noopener">Open PDF: ${safeTitle}</a>` +
      `</div>`,
  };
}

function warnMissingEmbed(
  notePath: string | undefined,
  target: string,
  attachmentsDir: string,
): void {
  const note = notePath
    ? path.relative(process.cwd(), notePath)
    : '(unknown note)';
  console.warn(
    `[remark-obsidian-images] Missing embed ![[${target.trim()}]] in ${note}\n` +
      `  Place the file in: ${attachmentsDir}`,
  );
}

function expandObsidianEmbeds(
  text: string,
  markdownDir: string,
  notePath: string | undefined,
): (PhrasingContent | RootContent)[] | null {
  OBSIDIAN_EMBED_RE.lastIndex = 0;
  if (!OBSIDIAN_EMBED_RE.test(text)) return null;

  OBSIDIAN_EMBED_RE.lastIndex = 0;
  const nodes: (PhrasingContent | RootContent)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const attachmentsDir = sharedAttachmentsDir(NOTES_CONTENT_ROOT);

  while ((match = OBSIDIAN_EMBED_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }

    const rawTarget = match[1];
    const { fragment } = splitTarget(rawTarget);
    const { alt, widthPx } = parsePipe(match[2], rawTarget);
    const resolved = resolveEmbedUrl(markdownDir, rawTarget);

    if (resolved?.kind === 'pdf') {
      const pdfHeight = parsePdfHeight(fragment);
      nodes.push(buildPdfNode(resolved.url, alt, pdfHeight));
    } else if (resolved?.kind === 'image') {
      nodes.push(buildImageNode(resolved.url, alt, widthPx));
    } else {
      warnMissingEmbed(notePath, rawTarget, attachmentsDir);
      nodes.push(
        buildImageNode(MISSING_IMAGE_SRC, `Missing image: ${rawTarget.trim()}`, widthPx),
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
 * Obsidian embeds `![[...]]` → images or PDF viewers.
 * Resolves relative paths, `../attachments/...`, and shared `attachments/` folder.
 */
export const remarkObsidianImages: Plugin<[], Root> = () => (tree, file) => {
  const markdownDir = file.path
    ? path.dirname(file.path)
    : (file.dirname ?? process.cwd());

  visit(tree, 'text', (node: Text, index, parent) => {
    if (parent == null || index == null) return;
    const expanded = expandObsidianEmbeds(node.value, markdownDir, file.path);
    if (!expanded) return;
    (parent.children as (PhrasingContent | RootContent)[]).splice(
      index,
      1,
      ...expanded,
    );
  });
};
