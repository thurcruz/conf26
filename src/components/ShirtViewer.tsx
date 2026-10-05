'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';

export type Side = 'frente' | 'costas';

type Props = {
  label: string;
  frontImg: string;
  backImg: string;
};

const SIDES: { id: Side; label: string }[] = [
  { id: 'frente', label: 'Frente' },
  { id: 'costas', label: 'Costas' }
];

/** Distancia em px a partir da qual tratamos o gesto como arrasto, nao clique. */
const DRAG_THRESHOLD = 6;

export function ShirtViewer({ label, frontImg, backImg }: Props) {
  const imgs: Record<Side, string> = { frente: frontImg, costas: backImg };
  const [side, setSide] = useState<Side>('frente');
  const [zoomOpen, setZoomOpen] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ startX: 0, startLeft: 0, active: false, moved: 0 });

  const index = SIDES.findIndex((s) => s.id === side);

  const goTo = useCallback((i: number) => {
    const el = trackRef.current;
    if (!el) {
      setSide(SIDES[i].id);
      return;
    }
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  }, []);

  // Mantem o `side` em sincronia com a posicao do scroll (swipe nativo no touch).
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    function onScroll() {
      if (!el) return;
      const i = Math.round(el.scrollLeft / el.clientWidth);
      const next = SIDES[i]?.id;
      if (next) setSide((cur) => (cur !== next ? next : cur));
    }
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Arrasto com mouse no desktop (no touch o scroll-snap ja resolve).
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse') return;
    const el = trackRef.current;
    if (!el) return;
    drag.current = { startX: e.clientX, startLeft: el.scrollLeft, active: true, moved: 0 };
    el.setPointerCapture(e.pointerId);
    el.style.scrollSnapType = 'none';
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return;
    const el = trackRef.current;
    if (!el) return;
    const dx = e.clientX - drag.current.startX;
    drag.current.moved = Math.max(drag.current.moved, Math.abs(dx));
    el.scrollLeft = drag.current.startLeft - dx;
  }
  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return;
    drag.current.active = false;
    const el = trackRef.current;
    if (!el) return;
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {}
    el.style.scrollSnapType = 'x mandatory';
    const nearest = Math.round(el.scrollLeft / el.clientWidth);
    el.scrollTo({ left: nearest * el.clientWidth, behavior: 'smooth' });
  }

  /** So abre o zoom se o gesto foi um clique de verdade, nao o fim de um arrasto. */
  function handleSlideClick() {
    if (drag.current.moved > DRAG_THRESHOLD) return;
    setZoomOpen(true);
  }

  return (
    <div>
      <div className="relative aspect-square rounded-2xl border border-smoke overflow-hidden bg-bone">
        <div
          ref={trackRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="no-scrollbar flex h-full overflow-x-auto snap-x snap-mandatory cursor-grab active:cursor-grabbing select-none"
          style={{ scrollSnapType: 'x mandatory' }}
          role="region"
          aria-label={`Camisa ${label} — arraste para ver frente e costas`}
        >
          {SIDES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={handleSlideClick}
              aria-label={`Ampliar estampa — ${label}, ${s.label}`}
              className="relative w-full h-full flex-shrink-0 snap-center cursor-zoom-in"
            >
              <Image
                src={imgs[s.id]}
                alt={`Camisa ${label} (${s.label})`}
                fill
                sizes="(min-width: 768px) 420px, 90vw"
                className="object-contain pointer-events-none"
                draggable={false}
              />
            </button>
          ))}
        </div>

        {/* Botao de lupa — deixa o zoom descobrivel */}
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          aria-label={`Ampliar estampa da camisa ${label}`}
          className="absolute top-2.5 right-2.5 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm
                     border border-smoke text-ink flex items-center justify-center
                     transition-colors hover:border-ink"
        >
          <ZoomIcon className="w-[18px] h-[18px]" />
        </button>

        <div className="absolute bottom-2 left-2 right-2 flex justify-between gap-2 pointer-events-none">
          {SIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(i)}
              className={`v-chip pointer-events-auto ${side === s.id ? 'v-chip-active' : ''}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="font-body text-xs text-ash">
          Arraste para o lado · toque para ampliar
        </p>
        <div className="flex gap-1.5" role="tablist" aria-label="Lados da camisa">
          {SIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={index === i}
              aria-label={`Ver ${s.label}`}
              onClick={() => goTo(i)}
              className={`w-2 h-2 rounded-full border transition-colors ${
                index === i ? 'bg-ink border-ink' : 'bg-transparent border-ash'
              }`}
            />
          ))}
        </div>
      </div>

      {zoomOpen && (
        <ShirtZoom
          label={label}
          imgs={imgs}
          side={side}
          onSide={setSide}
          onClose={() => setZoomOpen(false)}
        />
      )}
    </div>
  );
}

function ZoomIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="10.5" cy="10.5" r="6.5" />
      <line x1="15.5" y1="15.5" x2="21" y2="21" />
      <line x1="10.5" y1="7.5" x2="10.5" y2="13.5" />
      <line x1="7.5" y1="10.5" x2="13.5" y2="10.5" />
    </svg>
  );
}

const MIN_SCALE = 1;
const MAX_SCALE = 6;
/** Zoom inicial do modal: ja abre perto o suficiente para ler a estampa. */
const INITIAL_SCALE = 2.4;

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function ShirtZoom({
  label,
  imgs,
  side,
  onSide,
  onClose
}: {
  label: string;
  imgs: Record<Side, string>;
  side: Side;
  onSide: (s: Side) => void;
  onClose: () => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(INITIAL_SCALE);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  // Ponteiros ativos, para suportar pinca com dois dedos.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; scale: number } | null>(null);
  const pan = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  /** Limita o deslocamento para a imagem nunca sair de vista. */
  const clampPos = useCallback((x: number, y: number, s: number) => {
    const el = boxRef.current;
    if (!el) return { x, y };
    const maxX = (el.clientWidth * (s - 1)) / 2;
    const maxY = (el.clientHeight * (s - 1)) / 2;
    return { x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) };
  }, []);

  const applyScale = useCallback(
    (next: number) => {
      const s = clamp(next, MIN_SCALE, MAX_SCALE);
      setScale(s);
      setPos((p) => clampPos(p.x, p.y, s));
    },
    [clampPos]
  );

  // Esc fecha; trava o scroll do fundo enquanto o modal esta aberto.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') applyScale(scale + 0.5);
      if (e.key === '-') applyScale(scale - 0.5);
    }
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, applyScale, scale]);

  // Trocar de lado volta ao enquadramento inicial.
  useEffect(() => {
    setScale(INITIAL_SCALE);
    setPos({ x: 0, y: 0 });
  }, [side]);

  function onPointerDown(e: React.PointerEvent) {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale };
      pan.current = null;
    } else {
      pan.current = { x: pos.x, y: pos.y, px: e.clientX, py: e.clientY };
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = Array.from(pointers.current.values());
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      applyScale((pinch.current.scale * dist) / pinch.current.dist);
      return;
    }

    if (pan.current) {
      const nx = pan.current.x + (e.clientX - pan.current.px);
      const ny = pan.current.y + (e.clientY - pan.current.py);
      setPos(clampPos(nx, ny, scale));
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) pan.current = null;
  }

  function onWheel(e: React.WheelEvent) {
    applyScale(scale - e.deltaY * 0.0025 * scale);
  }

  function toggleScale() {
    if (scale > INITIAL_SCALE) {
      setScale(INITIAL_SCALE);
      setPos({ x: 0, y: 0 });
    } else {
      applyScale(4);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] bg-navy/95 backdrop-blur-sm flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={`Estampa da camisa ${label}`}
    >
      <header className="flex items-center justify-between gap-3 px-4 py-3 shrink-0">
        <p className="font-display font-semibold text-white truncate">
          {label}
          <span className="text-white/50 font-normal"> · {side}</span>
        </p>
        <button
          type="button"
          onClick={onClose}
          className="v-btn v-btn-sm v-btn-outline-light"
          aria-label="Fechar"
        >
          Fechar
        </button>
      </header>

      <div
        ref={boxRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onDoubleClick={toggleScale}
        className="relative flex-1 overflow-hidden touch-none select-none cursor-grab active:cursor-grabbing"
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            transition: pan.current || pinch.current ? 'none' : 'transform 0.18s ease-out'
          }}
        >
          <Image
            src={imgs[side]}
            alt={`Camisa ${label} (${side}) ampliada`}
            fill
            sizes="(min-width: 1024px) 1600px, 100vw"
            className="object-contain pointer-events-none"
            draggable={false}
            priority
          />
        </div>
      </div>

      <footer className="shrink-0 px-4 py-4 flex flex-wrap items-center justify-center gap-2">
        {SIDES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSide(s.id)}
            className={`v-chip ${
              side === s.id ? 'v-chip-active' : 'bg-transparent text-white border-white/35'
            }`}
          >
            {s.label}
          </button>
        ))}

        <span className="w-px h-6 bg-white/20 mx-1" aria-hidden="true" />

        <button
          type="button"
          onClick={() => applyScale(scale - 0.6)}
          disabled={scale <= MIN_SCALE}
          className="v-btn v-btn-sm v-btn-outline-light !px-3"
          aria-label="Diminuir zoom"
        >
          −
        </button>
        <span className="font-display font-semibold text-sm text-white/70 tabular-nums w-12 text-center">
          {scale.toFixed(1)}x
        </span>
        <button
          type="button"
          onClick={() => applyScale(scale + 0.6)}
          disabled={scale >= MAX_SCALE}
          className="v-btn v-btn-sm v-btn-outline-light !px-3"
          aria-label="Aumentar zoom"
        >
          +
        </button>

        <p className="basis-full text-center font-body text-xs text-white/40 mt-1">
          Arraste para mover · role ou use pinça para aproximar
        </p>
      </footer>
    </div>
  );
}
