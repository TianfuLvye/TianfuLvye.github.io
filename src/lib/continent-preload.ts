import { buildingUrl } from '../config/building-catalog';
import { enabledDecorations } from '../config/decoration-catalog';
import { enabledRoadTiles } from '../config/road-catalog';
import { preloadGltfUrls } from '../components/GlTFModel';
import { continentMapConfig, type ContinentMapConfig } from './map-config';
import {
  placeContinentLayout,
  type ContinentLayout,
} from './place-continent-layout';
import type { ContinentData } from './types';

const layoutCache = new Map<string, ContinentLayout>();
const mapConfigCache = new Map<string, ContinentMapConfig>();
const preloading = new Set<string>();

function runPreload(continent: ContinentData) {
  const mapConfig = continentMapConfig(continent.notes.length);
  mapConfigCache.set(continent.id, mapConfig);

  const layout = placeContinentLayout(continent.notes, mapConfig);
  layoutCache.set(continent.id, layout);

  const buildingUrls = layout.buildings
    .map((b) => buildingUrl(b.modelId))
    .filter((u): u is string => !!u);
  const decorUrls = enabledDecorations().map((d) => d.url);
  const roadUrls = enabledRoadTiles().map((r) => r.url);
  preloadGltfUrls([...buildingUrls, ...decorUrls, ...roadUrls]);

  preloading.delete(continent.id);
}

/** Cached layout from a prior preload, if any. */
export function getCachedContinentLayout(
  continentId: string,
): ContinentLayout | null {
  return layoutCache.get(continentId) ?? null;
}

/** Cached map config from a prior preload, if any. */
export function getCachedMapConfig(
  continentId: string,
  noteCount: number,
): ContinentMapConfig {
  return mapConfigCache.get(continentId) ?? continentMapConfig(noteCount);
}

/**
 * Warm layout + GLB cache for a continent.
 * `urgent`: run ASAP (e.g. double-click → cloud cover window).
 * Default: idle-time preload after globe focus.
 */
export function scheduleContinentPreload(
  continent: ContinentData,
  options?: { urgent?: boolean },
) {
  if (layoutCache.has(continent.id) || preloading.has(continent.id)) return;
  preloading.add(continent.id);

  if (options?.urgent) {
    queueMicrotask(() => runPreload(continent));
    return;
  }

  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => runPreload(continent), { timeout: 3000 });
  } else {
    setTimeout(() => runPreload(continent), 100);
  }
}
