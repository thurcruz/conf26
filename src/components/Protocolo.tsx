'use client';

import { useEffect, useRef, useState } from 'react';

/** Botao de copiar com retorno visual. Usa clipboard e cai num fallback
 *  quando o navegador bloqueia (http sem localhost, permissao negada). */
function useCopiar() {
  const [copiado, setCopiado] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      // fallback para navegadores/contextos sem Clipboard API
      const ta = document.createElement('textarea');
      ta.value = texto;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        /* desiste silenciosamente — o numero esta visivel na tela de qualquer jeito */
      }
      document.body.removeChild(ta);
    }
    setCopiado(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopiado(false), 2000);
  }

  return { copiado, copiar };
}

/**
 * Protocolo em destaque com botao de copiar — usado na tela final do checkout.
 */
export function ProtocoloDestaque({ protocolo }: { protocolo: string }) {
  const { copiado, copiar } = useCopiar();

  return (
    <div>
      <p className="font-display text-[11px] tracking-[0.2em] uppercase text-ash">
        Número do seu pedido
      </p>
      <div className="mt-1.5 flex items-center gap-3 flex-wrap">
        <p className="font-display font-bold text-3xl sm:text-4xl tracking-tight tabular-nums">
          #{protocolo}
        </p>
        <button
          type="button"
          onClick={() => copiar(protocolo)}
          className="v-btn v-btn-sm"
          aria-label="Copiar número do pedido"
        >
          {copiado ? '✓ Copiado' : 'Copiar'}
        </button>
      </div>
    </div>
  );
}

/**
 * Versao compacta para o painel da secretaria — ela precisa do mesmo numero
 * para localizar a reserva e repassar para quem perguntar.
 */
export function ProtocoloChip({ protocolo }: { protocolo: string }) {
  const { copiado, copiar } = useCopiar();

  return (
    <button
      type="button"
      onClick={() => copiar(protocolo)}
      title="Copiar número do pedido"
      className="inline-flex items-center gap-1.5 rounded-full border border-smoke bg-bone
                 px-3 py-1 font-display font-semibold text-sm tabular-nums text-ink
                 transition-colors hover:border-ink"
    >
      #{protocolo}
      <span className="text-[11px] font-normal text-ash">{copiado ? '✓' : 'copiar'}</span>
    </button>
  );
}
