import { useEffect, useState } from 'react';

interface Props {
  active: boolean;
  onMidpoint?: () => void;
  onComplete?: () => void;
}

/**
 * 云朵转场：
 *   t=0    隐藏
 *   t=0.5  完全遮住屏幕（此时切换 globe ↔ map）
 *   t=1    淡出
 */
export default function CloudTransition({
  active,
  onMidpoint,
  onComplete,
}: Props) {
  const [phase, setPhase] = useState<'idle' | 'cover' | 'reveal'>('idle');

  useEffect(() => {
    if (!active) return;
    setPhase('cover');
    const t1 = window.setTimeout(() => {
      onMidpoint?.();
      setPhase('reveal');
    }, 850);
    const t2 = window.setTimeout(() => {
      setPhase('idle');
      onComplete?.();
    }, 1600);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [active, onMidpoint, onComplete]);

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
