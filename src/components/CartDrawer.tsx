'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/store/cart';

function brl(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const total = useCart((s) => s.total());
  const reserve = useCart((s) => s.reserve());
  const count = useCart((s) => s.count());

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 v-btn v-btn-dark"
        aria-label="Abrir carrinho"
      >
        Carrinho ({mounted ? count : 0})
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar"
            className="flex-1 bg-ink/60"
          />
          <aside className="w-full max-w-md bg-paper border-l-2 border-ink shadow-vintage-lg flex flex-col">
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
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                className={`v-btn w-full mt-3 ${items.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}
              >
                Finalizar reserva
              </Link>
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}
