import path from 'node:path';
import type { Link, PhrasingContent, Root, Text } from 'mdast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import { NOTES_CONTENT_ROOT } from './content-paths';

/** Obsidian wikilink: [[Note]] or [[folder/note|label]] — not image embeds (![[...]]). */
const WIKILINK_RE = /(?<!!)\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g;

/** Match Astro content slug ids (file names lowercased in routes). */
function resolveWikilinkHref(markdownDir: string, rawTarget: string): string {
  const target = rawTarget.trim().replace(/\.md$/i, '');
  const absolute = path.resolve(markdownDir, target);
  const rel = path.relative(NOTES_CONTENT_ROOT, absolute);
  const segments =
    rel.startsWith('..') || path.isAbsolute(rel)
      ? target.split(/[/\\]/)
      : rel.split(path.sep);
  const slug = segments.map((s) => s.toLowerCase()).join('/');
  return `/notes/${slug}/`;
}

function expandWikilinks(text: string, markdownDir: string): PhrasingContent[] | null {
  WIKILINK_RE.lastIndex = 0;
  if (!WIKILINK_RE.test(text)) return null;

  WIKILINK_RE.lastIndex = 0;
  const nodes: PhrasingContent[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = WIKILINK_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    const target = match[1];
    const label = match[2]?.trim() || target.replace(/\.md$/i, '');
    const href = resolveWikilinkHref(markdownDir, target);
    const link: Link = {
      type: 'link',
      url: href,
      title: null,
      children: [{ type: 'text', value: label }],
    };
    nodes.push(link);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return nodes.length > 0 ? nodes : null;
}

/**
 * Turn Obsidian wikilinks `[[note]]` into internal note links.
 */
export const remarkObsidianWikilinks: Plugin<[], Root> = () => (tree, file) => {
  const markdownDir = file.path
    ? path.dirname(file.path)
    : (file.dirname ?? process.cwd());

  visit(tree, 'text', (node: Text, index, parent) => {
    if (parent == null || index == null) return;
    const expanded = expandWikilinks(node.value, markdownDir);
    if (!expanded) return;
    (parent.children as PhrasingContent[]).splice(index, 1, ...expanded);
  });
};
