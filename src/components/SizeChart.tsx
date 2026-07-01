'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

const CHARTS = [
  {
    id: 'adulto',
    label: 'Adulto',
    src: '/TABELADA_DE_MEDIDAS.jpeg',
    alt: 'Tabela de medidas Adulto — Casual e Oversize'
  },
  {
    id: 'infantil',
    label: 'Infantil',
    src: '/TABELADA_DE_MEDIDAS_INFANTIL.jpeg',
    alt: 'Tabela de medidas Infantil — 2 a 14 anos'
  }
] as const;

export function SizeChart() {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startLeft: number; dragging: boolean }>({
    startX: 0,
    startLeft: 0,
    dragging: false
  });

  function goTo(i: number) {
    const el = trackRef.current;
    if (!el) {
      setActive(i);
      return;
    }
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  }

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    function onScroll() {
      if (!el) return;
      const i = Math.round(el.scrollLeft / el.clientWidth);
      setActive((cur) => (cur !== i ? i : cur));
    }
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Mouse drag no desktop (touch/trackpad ja funciona nativo com snap)
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse') return;
    const el = trackRef.current;
    if (!el) return;
    dragRef.current = { startX: e.clientX, startLeft: el.scrollLeft, dragging: true };
    el.setPointerCapture(e.pointerId);
    el.style.scrollSnapType = 'none';
    el.style.cursor = 'grabbing';
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.dragging) return;
    const el = trackRef.current;
    if (!el) return;
    el.scrollLeft = dragRef.current.startLeft - (e.clientX - dragRef.current.startX);
  }
  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    const el = trackRef.current;
    if (!el) return;
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {}
    el.style.cursor = 'grab';
    // Restaura snap e ajusta para o slide mais proximo
    el.style.scrollSnapType = 'x mandatory';
    const nearest = Math.round(el.scrollLeft / el.clientWidth);
    el.scrollTo({ left: nearest * el.clientWidth, behavior: 'smooth' });
  }

  return (
    <div className="glass-card max-w-3xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-paper pb-3 mb-4">
        <h3 className="font-display text-2xl sm:text-3xl tracking-widest uppercase">
          Tabela de Medidas
        </h3>
        <div className="flex gap-2">
          {CHARTS.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => goTo(i)}
              className={`v-chip-glass ${active === i ? 'v-chip-glass-active' : ''}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="no-scrollbar flex overflow-x-auto snap-x snap-mandatory scroll-smooth cursor-grab select-none"
        role="region"
        aria-label="Tabelas de medidas — arraste para o lado"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {CHARTS.map((c) => (
          <div
            key={c.id}
            className="w-full flex-shrink-0 snap-center"
            aria-label={c.label}
          >
            <div className="relative w-full aspect-square border-2 border-paper bg-white pointer-events-none">
              <Image
                src={c.src}
                alt={c.alt}
                fill
                sizes="(min-width: 768px) 720px, 92vw"
                className="object-contain"
                draggable={false}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="font-body text-xs opacity-80">
          Arraste para o lado ou toque nos botões para alternar
        </p>
        <div className="flex gap-2" role="tablist" aria-label="Slides">
          {CHARTS.map((c, i) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={active === i}
              aria-label={`Ir para ${c.label}`}
              onClick={() => goTo(i)}
              className={`w-3 h-3 border-2 border-paper transition-colors ${
                active === i ? 'bg-paper' : 'bg-transparent'
              }`}
            />
          ))}
        </div>
      </div>

      <p className="font-body text-xs text-center mt-3 opacity-80">
        Margem de tolerância +/− 1 cm
      </p>
    </div>
  );
}
