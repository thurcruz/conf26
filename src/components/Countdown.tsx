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
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-30 v-card !p-2 !px-3 flex items-center gap-3 text-ink">
      <div className="font-display text-xs sm:text-sm tracking-widest uppercase hidden sm:block border-r-2 border-ink pr-3">
        31 · jul · 2026
      </div>
      <div className="flex items-center divide-x-2 divide-ink">
        {mounted ? (
          <>
            {cell(t.days, 'dias')}
            {cell(t.hours, 'h')}
            {cell(t.minutes, 'min')}
            {cell(t.seconds, 'seg')}
          </>
        ) : (
          <div className="font-display text-xl">--:--:--:--</div>
        )}
      </div>
    </div>
  );
}
