import { memo, useMemo } from 'react';
import { getDecoration } from '../config/decoration-catalog';
import { DECOR_FOOTPRINT_SCALE } from '../lib/map-config';
import GlTFModel from './GlTFModel';

interface Props {
  decorId: string;
  scale: number;
  rotation: number;
  position: [number, number, number];
  emphasized?: boolean;
}

function DecorationModel({
  decorId,
  scale,
  rotation,
  position,
}: Props) {
  const def = getDecoration(decorId);
  if (!def) return null;

  const footprint = (def.footprint ?? 0.55) * DECOR_FOOTPRINT_SCALE;
  const scaleMin =
    def.scaleMin != null ? def.scaleMin * DECOR_FOOTPRINT_SCALE : undefined;
  const scaleMax =
    def.scaleMax != null ? def.scaleMax * DECOR_FOOTPRINT_SCALE : undefined;
  const scaleTriple = useMemo(
    () => [scale, scale, scale] as [number, number, number],
    [scale],
  );

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <GlTFModel
        url={def.url}
        footprint={footprint}
        scale={scaleTriple}
        uniformScale
        fitExtent={def.fitExtent ?? 'xz'}
        scaleMin={scaleMin}
        scaleMax={scaleMax}
      />
    </group>
  );
}

export default memo(DecorationModel);
