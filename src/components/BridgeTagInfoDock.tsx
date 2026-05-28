import { useMemo } from 'react';
import {
  bridgeKindLabel,
  buildBridgeTagSections,
} from '../lib/bridge-tag-info';
import { bridgeKey } from '../lib/tag-bridge-animation';
import { colorForTag } from '../lib/tag-bridges';
import type { ContinentData } from '../lib/types';
import { useWorld } from '../store';

interface Props {
  continent: ContinentData;
}

export default function BridgeTagInfoDock({ continent }: Props) {
  const selectedKey = useWorld((s) => s.selectedTagBridgeKey);
  const hoverNotes = useWorld((s) => s.hoverNotes);

  const bridge = useMemo(
    () =>
      continent.tagBridges.find((b) => bridgeKey(b) === selectedKey) ?? null,
    [continent.tagBridges, selectedKey],
  );

  const sections = useMemo(
    () => (bridge ? buildBridgeTagSections(bridge, continent.notes) : []),
    [bridge, continent.notes],
  );

  if (!bridge) return null;

  const kindLabel = bridgeKindLabel(bridge.kind);

  return (
    <div className="bridge-info-dock">
      <div
        className="bridge-info-panel"
        onMouseLeave={() => hoverNotes([])}
      >
        {kindLabel && <div className="bridge-info-kind">{kindLabel}</div>}
        <p className="bridge-info-heading">
          These files share the same tag:
        </p>
        {sections.map((section) => (
          <div
            key={section.tag}
            className="bridge-info-tag-group"
            onMouseEnter={() =>
              hoverNotes(section.notes.map((n) => n.id))
            }
            onMouseLeave={() => hoverNotes([])}
          >
            <div className="bridge-info-tag-line">
              <span
                className="bridge-info-tag"
                style={{ color: colorForTag(section.tag) }}
              >
                tag {section.tag}
              </span>
              {section.notes[0] && (
                <>
                  <span className="bridge-info-sep"> — </span>
                  <span className="bridge-info-file">
                    {section.notes[0].title}
                  </span>
                </>
              )}
            </div>
            {section.notes.slice(1).map((note) => (
              <div
                key={note.id}
                className="bridge-info-file bridge-info-file-indent"
              >
                {note.title}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
