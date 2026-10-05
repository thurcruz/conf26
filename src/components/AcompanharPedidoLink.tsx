'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { lerReservasLembradas } from '@/lib/reserva';

/** Etiqueta/recibo — mesma linguagem de icone do carrinho. */
function TicketIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 3h14v18l-3.5-2.2L12 21l-3.5-2.2L5 21Z" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="9" y1="12" x2="15" y2="12" />
    </svg>
  );
}

/**
 * Atalho para /meus-pedidos. Quando o navegador ja tem pedido salvo, mostra o
 * protocolo no proprio botao — a pessoa ve que o site lembra dela antes de clicar.
 *
 * Renderiza o rotulo neutro no servidor e so ajusta depois de montar, para nao
 * quebrar a hidratacao (localStorage nao existe no SSR).
 */
export function AcompanharPedidoLink({
  className = '',
  variant = 'light'
}: {
  className?: string;
  /** `light` = sobre o azul-marinho do hero; `dark` = sobre fundo claro. */
  variant?: 'light' | 'dark';
}) {
  const [salvos, setSalvos] = useState<{ protocolo: string }[]>([]);

  useEffect(() => {
    setSalvos(lerReservasLembradas());
  }, []);

  const label =
    salvos.length === 0
      ? 'Acompanhar pedido'
      : salvos.length === 1
        ? `Meu pedido #${salvos[0].protocolo}`
        : `Meus pedidos (${salvos.length})`;

  return (
    <Link
      href="/meus-pedidos"
      className={`v-btn v-btn-sm ${
        variant === 'light' ? 'v-btn-outline-light backdrop-blur-sm' : ''
      } ${className}`}
    >
      <TicketIcon className="w-4 h-4 shrink-0" />
      <span className="whitespace-nowrap">{label}</span>
    </Link>
  );
}
