import { memo, useMemo } from 'react';
import { getDecoration } from '../config/decoration-catalog';
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

  const footprint = def.footprint ?? 0.55;
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
        scaleMin={def.scaleMin}
        scaleMax={def.scaleMax}
      />
    </group>
  );
}

export default memo(DecorationModel);
