'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/store/cart';

function brl(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function CartDrawer({ salesPaused = false }: { salesPaused?: boolean }) {
  const [open, setOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [infoSeen, setInfoSeen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const total = useCart((s) => s.total());
  const reserve = useCart((s) => s.reserve());
  const count = useCart((s) => s.count());

  useEffect(() => setMounted(true), []);

  // Toast quando adiciona item
  const [showToast, setShowToast] = useState(false);
  const prevCountRef = useRef(count);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!mounted) {
      prevCountRef.current = count;
      return;
    }
    if (count > prevCountRef.current && !open) {
      setShowToast(true);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setShowToast(false), 3200);
    }
    prevCountRef.current = count;
  }, [count, open, mounted]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (showInfo) {
        if (e.key === 'Escape') setShowInfo(false);
        return;
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [showInfo]);

  function openCart() {
    setOpen(true);
    if (!infoSeen) {
      setShowInfo(true);
      setInfoSeen(true);
    }
  }

  return (
    <>
      {mounted && showToast && !open && (
        <div
          className="fixed bottom-5 right-[4.5rem] z-40 flex items-center pointer-events-none animate-toast-in drop-shadow-[3px_3px_0_rgba(0,0,0,1)]"
          role="status"
          aria-live="polite"
        >
          <div className="border-2 border-r-0 border-ink bg-white text-ink font-display tracking-widest uppercase text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
            Seu pedido foi adicionado aqui
          </div>
          <svg
            width="8"
            height="16"
            viewBox="0 0 8 16"
            fill="none"
            className="-ml-[2px]"
            aria-hidden="true"
          >
            <polygon points="0,1 8,8 0,15" fill="#ffffff" stroke="none" />
            <polyline
              points="0,1 8,8 0,15"
              stroke="#0a0a0a"
              strokeWidth="2"
              strokeLinejoin="miter"
              fill="none"
            />
          </svg>
        </div>
      )}
      <button
        type="button"
        onClick={openCart}
        className="fixed bottom-4 right-4 z-40 v-btn !p-3"
        aria-label="Abrir carrinho"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="square"
          strokeLinejoin="miter"
          aria-hidden="true"
        >
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        {mounted && count > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[1.4rem] h-[1.4rem] px-1 inline-flex items-center justify-center bg-ink text-paper border-2 border-ink font-display text-xs tabular-nums">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar"
            className="flex-1 bg-ink/60"
          />
          <aside className="w-full max-w-md bg-paper text-ink border-l-2 border-ink shadow-vintage-lg flex flex-col">
            <header className="flex items-center justify-between p-4 border-b-2 border-ink bg-ink text-paper">
              <h2 className="font-display text-2xl tracking-widest uppercase">Carrinho</h2>
              <button type="button" onClick={() => setOpen(false)} className="v-btn v-btn-sm">
                Fechar
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 && (
                <p className="font-body text-center mt-8">Seu carrinho está vazio.</p>
              )}
              {items.map((i) => (
                <div key={i.id} className="border-2 border-ink p-3 bg-white">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="font-display text-lg tracking-wide uppercase leading-tight">
                        Camisa {i.colorLabel}
                      </p>
                      <p className="font-body text-sm">
                        Tamanho {i.size} · {i.typeLabel}
                      </p>
                      <p className="font-body text-sm mt-1">
                        {brl(i.unitPrice)} cada
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(i.id)}
                      className="v-btn v-btn-sm self-start"
                      aria-label="Remover"
                    >
                      ×
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQty(i.id, i.qty - 1)}
                      className="v-btn v-btn-sm"
                    >
                      −
                    </button>
                    <span className="font-display text-xl tabular-nums w-8 text-center">
                      {i.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty(i.id, i.qty + 1)}
                      className="v-btn v-btn-sm"
                    >
                      +
                    </button>
                    <span className="ml-auto font-body text-sm">
                      Subtotal <strong>{brl(i.unitPrice * i.qty)}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <footer className="p-4 border-t-2 border-ink bg-bone">
              <div className="flex justify-between font-body text-sm">
                <span>Total</span>
                <span>{brl(total)}</span>
              </div>
              <div className="flex justify-between font-display text-2xl tracking-wider uppercase mt-1">
                <span>Reserva 50%</span>
                <span>{brl(reserve)}</span>
              </div>
              {salesPaused ? (
                <p className="v-btn w-full mt-3 opacity-50 pointer-events-none">
                  Reservas indisponíveis
                </p>
              ) : (
                <Link
                  href="/checkout"
                  onClick={() => setOpen(false)}
                  className={`v-btn w-full mt-3 ${items.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  Finalizar reserva
                </Link>
              )}
            </footer>
          </aside>
        </div>
      )}

      {showInfo && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink/70"
          role="dialog"
          aria-modal="true"
          aria-labelledby="info-popup-title"
        >
          <div className="v-card max-w-md w-full text-ink relative">
            <button
              type="button"
              onClick={() => setShowInfo(false)}
              aria-label="Fechar aviso"
              className="absolute top-2 right-2 v-btn v-btn-sm !p-1 !px-2 leading-none"
            >
              ×
            </button>
            <h2
              id="info-popup-title"
              className="font-display text-2xl sm:text-3xl tracking-widest uppercase border-b-2 border-ink pb-2 pr-8"
            >
              Atenção
            </h2>
            <p className="font-body text-sm sm:text-base mt-3">
              Para confirmar sua reserva você precisa{' '}
              <strong>enviar o comprovante do PIX</strong>. Há duas formas:
            </p>
            <ul className="font-body text-sm sm:text-base mt-3 space-y-2 list-disc pl-5">
              <li>
                <strong>Anexar</strong> o comprovante no checkout do site, ou
              </li>
              <li>
                <strong>Enviar pelo WhatsApp</strong> da secretaria.
              </li>
            </ul>
            <p className="font-body text-xs sm:text-sm mt-3 opacity-80">
              Sem o comprovante, a reserva fica pendente e a camisa não é
              garantida.
            </p>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                className="v-btn v-btn-sm w-full"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
