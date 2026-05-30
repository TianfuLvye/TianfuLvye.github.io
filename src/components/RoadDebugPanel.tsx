import type { RoadTileKind } from '../config/road-catalog';
import type { RoadDebugSettings } from '../lib/road-debug';
import { ROAD_TILE_FOOTPRINT } from '../lib/map-config';
import { useWorld } from '../store';

function NumberField({
  label,
  value,
  step = 1,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="road-debug-field">
      <span className="road-debug-label">{label}</span>
      <input
        type="number"
        className="road-debug-input"
        value={Number.isFinite(value) ? value : 0}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
    </label>
  );
}

function patchKindOffset(
  debug: RoadDebugSettings,
  kind: RoadTileKind,
  value: number,
): RoadDebugSettings {
  return {
    ...debug,
    kindOffsetDeg: { ...debug.kindOffsetDeg, [kind]: value },
  };
}

export default function RoadDebugPanel() {
  const roadDebug = useWorld((s) => s.roadDebug);
  const setRoadDebug = useWorld((s) => s.setRoadDebug);
  const resetRoadDebug = useWorld((s) => s.resetRoadDebug);
  const showRoadDebugPanel = useWorld((s) => s.showRoadDebugPanel);
  const setShowRoadDebugPanel = useWorld((s) => s.setShowRoadDebugPanel);

  const update = (next: RoadDebugSettings) => {
    setRoadDebug(next);
  };

  const copyConfig = async () => {
    const text = JSON.stringify(roadDebug, null, 2);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      console.log('Road debug config:', text);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`road-debug-toggle ${showRoadDebugPanel ? 'is-active' : ''}`}
        onClick={() => setShowRoadDebugPanel(!showRoadDebugPanel)}
        title="Toggle road debug panel"
        aria-pressed={showRoadDebugPanel}
      >
        ⊙ road
      </button>

      {showRoadDebugPanel && (
        <div className="road-debug-panel">
          <div className="road-debug-head">
            <strong>马路调试</strong>
            <div className="road-debug-actions">
              <button type="button" onClick={copyConfig}>
                copy
              </button>
              <button type="button" onClick={resetRoadDebug}>
                reset
              </button>
            </div>
          </div>

          <fieldset className="road-debug-group">
            <legend>直道尺寸</legend>
            <NumberField
              label={`直道宽度倍率 (cell=${ROAD_TILE_FOOTPRINT.toFixed(3)})`}
              value={roadDebug.footprintScale}
              step={0.05}
              min={0.3}
              max={3}
              onChange={(v) => update({ ...roadDebug, footprintScale: v })}
            />
            <NumberField
              label="Y 偏移"
              value={roadDebug.yOffset}
              step={0.01}
              min={-0.2}
              max={0.5}
              onChange={(v) => update({ ...roadDebug, yOffset: v })}
            />
          </fieldset>

          <fieldset className="road-debug-group">
            <legend>全局旋转 (°)</legend>
            <NumberField
              label="defaultRotation"
              value={roadDebug.defaultRotationDeg}
              step={5}
              min={-180}
              max={180}
              onChange={(v) => update({ ...roadDebug, defaultRotationDeg: v })}
            />
          </fieldset>

          <fieldset className="road-debug-group">
            <legend>直道 (°)</legend>
            <NumberField
              label="E↔W"
              value={roadDebug.straightDeg.ew}
              step={5}
              onChange={(v) =>
                update({
                  ...roadDebug,
                  straightDeg: { ...roadDebug.straightDeg, ew: v },
                })
              }
            />
            <NumberField
              label="N↔S"
              value={roadDebug.straightDeg.ns}
              step={5}
              onChange={(v) =>
                update({
                  ...roadDebug,
                  straightDeg: { ...roadDebug.straightDeg, ns: v },
                })
              }
            />
          </fieldset>

          <fieldset className="road-debug-group">
            <legend>弯道 (°)</legend>
            <NumberField
              label="N→E"
              value={roadDebug.bendDeg.ne}
              step={5}
              onChange={(v) =>
                update({
                  ...roadDebug,
                  bendDeg: { ...roadDebug.bendDeg, ne: v },
                })
              }
            />
            <NumberField
              label="E→S"
              value={roadDebug.bendDeg.es}
              step={5}
              onChange={(v) =>
                update({
                  ...roadDebug,
                  bendDeg: { ...roadDebug.bendDeg, es: v },
                })
              }
            />
            <NumberField
              label="S→W"
              value={roadDebug.bendDeg.sw}
              step={5}
              onChange={(v) =>
                update({
                  ...roadDebug,
                  bendDeg: { ...roadDebug.bendDeg, sw: v },
                })
              }
            />
            <NumberField
              label="W→N"
              value={roadDebug.bendDeg.wn}
              step={5}
              onChange={(v) =>
                update({
                  ...roadDebug,
                  bendDeg: { ...roadDebug.bendDeg, wn: v },
                })
              }
            />
          </fieldset>

          <fieldset className="road-debug-group">
            <legend>类型额外旋转 (°)</legend>
            {(
              [
                'straight',
                'bend',
                'tJunction',
                'cross',
                'end',
              ] as RoadTileKind[]
            ).map((kind) => (
              <NumberField
                key={kind}
                label={kind}
                value={roadDebug.kindOffsetDeg[kind]}
                step={5}
                onChange={(v) => update(patchKindOffset(roadDebug, kind, v))}
              />
            ))}
          </fieldset>

          <details className="road-debug-more">
            <summary>T 字 / 端点 / 十字</summary>
            <fieldset className="road-debug-group">
              <legend>T 字 (°)</legend>
              {(
                [
                  ['esw', '缺 N'],
                  ['nsw', '缺 E'],
                  ['new', '缺 S'],
                  ['nes', '缺 W'],
                ] as const
              ).map(([key, label]) => (
                <NumberField
                  key={key}
                  label={label}
                  value={roadDebug.tJunctionDeg[key]}
                  step={5}
                  onChange={(v) =>
                    update({
                      ...roadDebug,
                      tJunctionDeg: {
                        ...roadDebug.tJunctionDeg,
                        [key]: v,
                      },
                    })
                  }
                />
              ))}
            </fieldset>
            <fieldset className="road-debug-group">
              <legend>端点 (°) — 接邻方向</legend>
              <NumberField
                label="N"
                value={roadDebug.endDeg.n}
                step={5}
                onChange={(v) =>
                  update({
                    ...roadDebug,
                    endDeg: { ...roadDebug.endDeg, n: v },
                  })
                }
              />
              <NumberField
                label="E 东接"
                value={roadDebug.endDeg.w}
                step={5}
                onChange={(v) =>
                  update({
                    ...roadDebug,
                    endDeg: { ...roadDebug.endDeg, w: v },
                  })
                }
              />
              <NumberField
                label="S"
                value={roadDebug.endDeg.s}
                step={5}
                onChange={(v) =>
                  update({
                    ...roadDebug,
                    endDeg: { ...roadDebug.endDeg, s: v },
                  })
                }
              />
              <NumberField
                label="W 西接"
                value={roadDebug.endDeg.e}
                step={5}
                onChange={(v) =>
                  update({
                    ...roadDebug,
                    endDeg: { ...roadDebug.endDeg, e: v },
                  })
                }
              />
            </fieldset>
            <NumberField
              label="十字 cross"
              value={roadDebug.crossDeg}
              step={5}
              onChange={(v) => update({ ...roadDebug, crossDeg: v })}
            />
          </details>

          <p className="road-debug-hint">
            直道：E↔W 用 doubleBarrier，N↔S 用 singleBarrier。端点 E/W
            与 GLB 轴向对调，面板已按接邻方向标注。调好参数后点 copy。
          </p>
        </div>
      )}
    </>
  );
}
