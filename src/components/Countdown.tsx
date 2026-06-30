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
    <div className="flex flex-col items-center px-2 sm:px-3">
      <span className="font-display text-2xl sm:text-3xl leading-none tabular-nums">
        {String(n).padStart(2, '0')}
      </span>
      <span className="font-body text-[9px] sm:text-[10px] tracking-widest uppercase opacity-80">
        {label}
      </span>
    </div>
  );

  return (
    <div className="w-full bg-ink text-paper border-b-2 border-ink">
      <div className="max-w-6xl mx-auto px-3 py-2 flex items-center justify-between gap-3">
        <div className="font-display text-xs sm:text-base tracking-widest uppercase">
          <span className="hidden sm:inline">31 · julho · 2026 — </span>
          <span>20h00</span>
        </div>
        <div className="flex items-center divide-x divide-paper/30">
          {mounted ? (
            <>
              {cell(t.days, 'dias')}
              {cell(t.hours, 'h')}
              {cell(t.minutes, 'min')}
              {cell(t.seconds, 'seg')}
            </>
          ) : (
            <div className="font-display text-2xl">--:--:--:--</div>
          )}
        </div>
      </div>
    </div>
  );
}
