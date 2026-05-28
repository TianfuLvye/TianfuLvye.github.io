import type { BuildingPlacement } from './layout';
import type { TagBridge } from './types';

export interface BridgeTagSection {
  tag: string;
  notes: Array<{ id: string; title: string }>;
}

/** One row group per shared tag on this bridge edge. */
export function buildBridgeTagSections(
  bridge: TagBridge,
  buildingsById: Map<string, BuildingPlacement>,
): BridgeTagSection[] {
  const source = buildingsById.get(bridge.sourceId);
  const target = buildingsById.get(bridge.targetId);
  if (!source || !target) return [];

  return bridge.tags.map((tag) => ({
    tag,
    notes: [
      { id: source.note.id, title: source.note.title },
      { id: target.note.id, title: target.note.title },
    ],
  }));
}

export function bridgeKindLabel(kind: TagBridge['kind']): string | null {
  if (kind === 'rainbow') return 'Rainbow bridge';
  if (kind === 'dual') return 'Dual-color bridge';
  return null;
}
