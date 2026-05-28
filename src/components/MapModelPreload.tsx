import { useEffect } from 'react';
import { buildingUrl, enabledBuildings } from '../config/building-catalog';
import { enabledDecorations } from '../config/decoration-catalog';
import { preloadGltfUrls } from './GlTFModel';
import type { BuildingPlacement } from '../lib/layout';

interface Props {
  buildings: BuildingPlacement[];
}

/** Preload GLBs used on the current continent map. */
export default function MapModelPreload({ buildings }: Props) {
  useEffect(() => {
    const buildingUrls = buildings
      .map((b) => buildingUrl(b.modelId))
      .filter((u): u is string => !!u);
    const decorUrls = enabledDecorations().map((d) => d.url);
    preloadGltfUrls([...buildingUrls, ...decorUrls]);
  }, [buildings]);

  return null;
}

export function preloadAllEnabledCatalog() {
  preloadGltfUrls([
    ...enabledBuildings().map((b) => b.url),
    ...enabledDecorations().map((d) => d.url),
  ]);
}
