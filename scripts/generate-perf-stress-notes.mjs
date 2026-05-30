#!/usr/bin/env node
/**
 * Generate perf-stress continent notes for map performance debugging.
 * 30 large (3000+ chars), 30 medium (200–2999), 40 small (<200).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'src/content/notes/perf-stress');

const PARAGRAPH =
  '这是性能压测大陆的正文填充段落，用于模拟笔记字数与建筑体量。段落编号 {n}。';

function bodyToLength(targetLen, index) {
  let body = `# 性能压测笔记 ${String(index).padStart(3, '0')}\n\n`;
  let n = 1;
  while (body.length < targetLen) {
    body += PARAGRAPH.replace('{n}', String(n)) + '\n\n';
    n += 1;
  }
  return body.slice(0, targetLen);
}

function writeNote(tier, index, targetLen) {
  const pad = String(index).padStart(2, '0');
  const id = `${tier}-${pad}`;
  const body = bodyToLength(targetLen, index);
  const actual = body.length;
  const frontmatter = `---
title: "Perf Stress ${tier} ${pad}"
date: 2026-05-30
summary: "Performance stress test — ${tier} tier (${actual} chars body)"
tags: [perf-stress, ${tier}]
---

`;
  fs.writeFileSync(
    path.join(OUT_DIR, `${id}.md`),
    frontmatter + body,
    'utf8',
  );
  return actual;
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const stats = { small: [], medium: [], large: [] };

  for (let i = 1; i <= 40; i++) {
    stats.small.push(writeNote('small', i, 80 + (i % 90)));
  }
  for (let i = 1; i <= 30; i++) {
    stats.medium.push(writeNote('medium', i, 400 + (i % 20) * 120));
  }
  for (let i = 1; i <= 30; i++) {
    stats.large.push(writeNote('large', i, 3200 + (i % 10) * 200));
  }

  const check = (name, lengths, min, max) => {
    const bad = lengths.filter((n) => n < min || n >= max);
    console.log(
      `${name}: ${lengths.length} files, min=${Math.min(...lengths)}, max=${Math.max(...lengths)}${bad.length ? `, OUT OF RANGE: ${bad.length}` : ''}`,
    );
  };

  check('small', stats.small, 0, 200);
  check('medium', stats.medium, 200, 3000);
  check('large', stats.large, 3000, Infinity);
  console.log(`Wrote ${stats.small.length + stats.medium.length + stats.large.length} notes to ${OUT_DIR}`);
}

main();
