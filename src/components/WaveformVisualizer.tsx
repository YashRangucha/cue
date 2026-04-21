'use client';

import { useEffect, useRef } from 'react';

interface Props {
  analyserNode: AnalyserNode | null;
  isActive: boolean;
}

export default function WaveformVisualizer({ analyserNode, isActive }: Props) {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive || !analyserNode) {
      barsRef.current.forEach((b) => {
        if (b) b.style.height = '2px';
      });
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const data = new Uint8Array(analyserNode.frequencyBinCount);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      analyserNode.getByteFrequencyData(data);
      barsRef.current.forEach((bar, i) => {
        if (!bar) return;
        const idx = Math.floor((i / 20) * data.length);
        const h = 2 + (data[idx] / 255) * 30;
        bar.style.height = `${h}px`;
      });
    };

    draw();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, analyserNode]);

  if (!isActive) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '32px', marginTop: '8px' }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { barsRef.current[i] = el; }}
          style={{
            width: '3px',
            height: '2px',
            backgroundColor: '#22c55e',
            borderRadius: '2px',
          }}
        />
      ))}
    </div>
  );
}
