import { useEffect, useState } from 'react';

interface Props {
  active: boolean;
  /** When false during an enter-map transition, clouds stay covered until the map is ready. */
  readyToReveal?: boolean;
  onMidpoint?: () => void;
  onComplete?: () => void;
}

const COVER_MS = 850;
/** cloud-out 0.75s + max puff stagger (14 × 0.018s) */
const REVEAL_MS = 1020;

/**
 * 云朵转场：
 *   cover   云层遮住屏幕
 *   midpoint 切换 globe ↔ map（仍保持遮住）
 *   reveal  目标视图就绪后淡出
 */
export default function CloudTransition({
  active,
  readyToReveal = true,
  onMidpoint,
  onComplete,
}: Props) {
  const [phase, setPhase] = useState<'idle' | 'cover' | 'reveal'>('idle');
  const [midpointReached, setMidpointReached] = useState(false);

  useEffect(() => {
    if (!active) {
      setPhase('idle');
      setMidpointReached(false);
      return;
    }

    setPhase('cover');
    setMidpointReached(false);

    const coverTimer = window.setTimeout(() => {
      setMidpointReached(true);
      onMidpoint?.();
    }, COVER_MS);

    return () => window.clearTimeout(coverTimer);
  }, [active, onMidpoint]);

  useEffect(() => {
    if (!active || phase !== 'cover' || !midpointReached || !readyToReveal) {
      return;
    }
    setPhase('reveal');
  }, [active, phase, midpointReached, readyToReveal]);

  useEffect(() => {
    if (phase !== 'reveal') return;

    const completeTimer = window.setTimeout(() => {
      setPhase('idle');
      onComplete?.();
    }, REVEAL_MS);

    return () => window.clearTimeout(completeTimer);
  }, [phase, onComplete]);

  if (phase === 'idle') return null;

  return (
    <div className={`cloud-overlay cloud-${phase}`}>
      {Array.from({ length: 14 }).map((_, i) => (
        <span
          key={i}
          className="cloud-puff"
          style={
            {
              ['--i' as any]: i,
              ['--seed' as any]: (i * 37) % 100,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
