/**
 * Trunk path parity checks for findTrunkPath refactor.
 * Run: node scripts/path-parity.mjs
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const result = spawnSync('npx', ['tsx', 'scripts/path-parity-run.ts'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

process.exit(result.status ?? 1);
