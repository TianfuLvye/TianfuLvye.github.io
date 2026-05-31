import { Html } from '@react-three/drei';
import type { HtmlProps } from '@react-three/drei/web/Html';
import { useFrame, useThree } from '@react-three/fiber';
import { useState } from 'react';
import * as THREE from 'three';

type Props = Omit<HtmlProps, 'distanceFactor'> & {
  /** Target screen scale under OrthographicCamera (default 1). */
  multiplier?: number;
};

/**
 * drei Html under OrthographicCamera scales as zoom × distanceFactor.
 * Keeps zoom compensation local so MapView / Building memo are not invalidated.
 */
export default function OrthoScaledHtml({
  multiplier = 1,
  children,
  ...htmlProps
}: Props) {
  const camera = useThree((s) => s.camera);
  const [factor, setFactor] = useState(() =>
    camera instanceof THREE.OrthographicCamera
      ? multiplier / camera.zoom
      : multiplier,
  );

  useFrame(() => {
    if (!(camera instanceof THREE.OrthographicCamera)) return;
    const next = multiplier / camera.zoom;
    setFactor((prev) => (Math.abs(prev - next) > 1e-5 ? next : prev));
  });

  return (
    <Html distanceFactor={factor} {...htmlProps}>
      {children}
    </Html>
  );
}
