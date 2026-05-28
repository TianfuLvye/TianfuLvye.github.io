import {
  enabledBuildings,
  getBuilding,
  type BuildingDef,
  type SizeTier,
} from '../config/building-catalog';
import { sizeTierFromNoteSize } from './note-size';
import { rngFor } from './random';
import type { NoteData } from './types';

const TIER_ORDER: SizeTier[] = ['small', 'medium', 'large'];

function widenTiers(tier: SizeTier): SizeTier[] {
  const i = TIER_ORDER.indexOf(tier);
  const out: SizeTier[] = [tier];
  if (i > 0) out.push(TIER_ORDER[i - 1]);
  if (i < TIER_ORDER.length - 1) out.push(TIER_ORDER[i + 1]);
  return out;
}

function candidatesForTier(tiers: SizeTier[]): BuildingDef[] {
  const set = new Set(tiers);
  return enabledBuildings().filter((b) => set.has(b.sizeTier));
}

function weightedPick(pool: BuildingDef[], rng: () => number): BuildingDef {
  const total = pool.reduce((s, b) => s + (b.weight ?? 1), 0);
  let t = rng() * total;
  for (const b of pool) {
    t -= b.weight ?? 1;
    if (t <= 0) return b;
  }
  return pool[pool.length - 1];
}

/**
 * Stable building model per note: frontmatter → size tier → seeded random.
 */
export function pickBuildingModel(note: NoteData): string {
  const fm = note.building?.trim();
  if (fm) {
    const fromFm = getBuilding(fm);
    if (fromFm) return fromFm.id;
    if (import.meta.env.DEV) {
      console.warn(`[world] unknown building frontmatter "${fm}" for ${note.id}`);
    }
  }

  const tier = sizeTierFromNoteSize(note.size);
  let pool = candidatesForTier([tier]);
  if (pool.length === 0) pool = candidatesForTier(widenTiers(tier));
  if (pool.length === 0) pool = enabledBuildings();
  if (pool.length === 0) {
    if (import.meta.env.DEV) {
      console.warn('[world] no enabled buildings in catalog');
    }
    return 'house';
  }

  const rng = rngFor(`building-model:${note.id}`);
  return weightedPick(pool, rng).id;
}

export function pickBuildingModelsForNotes(notes: NoteData[]): string[] {
  return notes.map((n) => pickBuildingModel(n));
}
