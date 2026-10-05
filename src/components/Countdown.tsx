'use client';

import { useEffect, useState } from 'react';
import { EVENT } from '@/lib/products';

function diff(target: number) {
  const now = Date.now();
  const d = Math.max(0, target - now);
  return {
    days:    Math.floor(d / 86_400_000),
    hours:   Math.floor((d / 3_600_000) % 24),
    minutes: Math.floor((d / 60_000) % 60),
    seconds: Math.floor((d / 1_000) % 60)
  };
}

/**
 * Contagem regressiva ate o primeiro dia do evento.
 * Fica dentro da hero (sobre o azul), alinhada a esquerda junto com o
 * resto do conteudo — nao e um balao flutuante.
 */
export function Countdown() {
  const target = new Date(EVENT.date).getTime();
  const [t, setT] = useState(() => diff(target));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const cell = (n: number, label: string) => (
    <div className="flex items-baseline gap-1.5">
      <span className="font-display font-bold text-2xl sm:text-3xl leading-none tabular-nums">
        {String(n).padStart(2, '0')}
      </span>
      <span className="font-body text-[10px] tracking-[0.14em] uppercase text-white/45">
        {label}
      </span>
    </div>
  );

  return (
    <div>
      <p className="font-display text-[11px] tracking-[0.2em] uppercase text-white/40">
        Faltam
      </p>
      <div className="mt-2 flex items-baseline gap-4 sm:gap-6" aria-live="off">
        {mounted ? (
          <>
            {cell(t.days, 'dias')}
            {cell(t.hours, 'h')}
            {cell(t.minutes, 'min')}
            {cell(t.seconds, 'seg')}
          </>
        ) : (
          /* Placeholder com a mesma altura, evita salto no hidrate */
          <span className="font-display font-bold text-2xl sm:text-3xl leading-none text-white/25">
            --
          </span>
        )}
      </div>
    </div>
  );
}
