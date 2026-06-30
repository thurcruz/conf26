'use client';

import { useEffect, useRef } from 'react';

/**
 * Static background image (/FUNDO.png) with a 3D camera-pan effect.
 * Combines a slow CSS keyframe (auto-play) with a subtle mouse-parallax
 * tilt so the scene feels alive.
 */
export function Background3D() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = layerRef.current;
    if (!el) return;

    let raf = 0;
    let mx = 0, my = 0;

    function onMove(e: PointerEvent) {
      const w = window.innerWidth, h = window.innerHeight;
      mx = (e.clientX / w - 0.5) * 2;   // -1 .. 1
      my = (e.clientY / h - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(apply);
    }

    function apply() {
      raf = 0;
      if (!el) return;
      el.style.setProperty('--mx', String(mx));
      el.style.setProperty('--my', String(my));
    }

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-ink stage-3d">
      <div
        ref={layerRef}
        className="bg-layer absolute inset-[-8%]"
        style={{
          backgroundImage: 'url(/FUNDO.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform:
            'translate3d(calc(var(--mx,0) * -10px), calc(var(--my,0) * -10px), 0) scale(1.1)'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40 pointer-events-none" />
    </div>
  );
}
