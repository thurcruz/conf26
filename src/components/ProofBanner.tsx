import { EVENT } from '@/lib/products';

const MESSAGE = 'É obrigatório enviar o comprovante do PIX no WhatsApp';

/** Placa de aviso: triangulo com exclamacao. */
function WarningSign({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10.3 3.9 1.8 18.2A2 2 0 0 0 3.5 21.2h17A2 2 0 0 0 22.2 18.2L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <line x1="12" y1="9" x2="12" y2="13.5" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/** Uma copia do texto + separador. O track usa duas copias lado a lado
 *  para o marquee reiniciar sem corte visivel ao transladar -50%. */
function Strip() {
  return (
    <span className="inline-flex shrink-0 items-center" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="inline-flex shrink-0 items-center gap-2 pl-5 pr-5">
          <WarningSign className="w-[14px] h-[14px] sm:w-4 sm:h-4 shrink-0" />
          <span className="font-display font-semibold uppercase tracking-[0.12em] text-xs sm:text-sm">
            {MESSAGE}
          </span>
        </span>
      ))}
    </span>
  );
}

/**
 * Faixa rosa full-bleed com o aviso do comprovante — fica grudada no topo da tela.
 * O texto roda em marquee (para em prefers-reduced-motion) e a faixa
 * inteira e um link para o WhatsApp da secretaria.
 *
 * A altura e fixa (h-11 / sm:h-12 = 44px / 48px) de proposito: o Countdown e o
 * header do checkout se posicionam logo abaixo dela com os offsets `top-11 sm:top-12`.
 */
export function ProofBanner() {
  return (
    <a
      href={`https://wa.me/${EVENT.whatsapp}`}
      target="_blank"
      rel="noreferrer"
      className="sticky top-0 z-40 flex h-11 sm:h-12 items-center overflow-hidden
                 bg-pink text-white transition-colors hover:bg-pink-dark"
      aria-label={`${MESSAGE} — toque para abrir o WhatsApp da secretaria`}
    >
      <div className="marquee-track">
        <Strip />
        <Strip />
      </div>
    </a>
  );
}
