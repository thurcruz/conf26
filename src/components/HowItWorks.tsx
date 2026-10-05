type Step = {
  title: string;
  text: string;
  icon: React.ReactNode;
};

const ICON = 'w-6 h-6';
const STROKE = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const
};

const STEPS: Step[] = [
  {
    title: 'Escolha',
    text: 'Selecione a cor, o tamanho e o modelo da sua camisa: infantil, casual ou oversize.',
    icon: (
      <svg viewBox="0 0 24 24" className={ICON} {...STROKE} aria-hidden="true">
        <path d="M8.5 3 5 4.6A2 2 0 0 0 3.8 6.8l.7 3.4h2V20a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-9.8h2l.7-3.4A2 2 0 0 0 19 4.6L15.5 3" />
        <path d="M8.5 3a3.5 3.5 0 0 0 7 0" />
      </svg>
    )
  },
  {
    title: 'Reserve',
    text: 'Pague 50% via PIX e envie o comprovante pelo site ou pelo WhatsApp da secretaria.',
    icon: (
      <svg viewBox="0 0 24 24" className={ICON} {...STROKE} aria-hidden="true">
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M3 9h18" />
        <path d="M7 13h4" />
        <path d="M12 21h8" />
      </svg>
    )
  },
  {
    title: 'Retire',
    text: 'A camisa fica liberada para retirada quando avisarmos nos grupos de aviso e na semana da conferência. Mais informações com a secretaria.',
    icon: (
      <svg viewBox="0 0 24 24" className={ICON} {...STROKE} aria-hidden="true">
        <path d="M5.5 8h13l1 12a1 1 0 0 1-1 1.1H5.5A1 1 0 0 1 4.5 20Z" />
        <path d="M8.5 8V6a3.5 3.5 0 0 1 7 0v2" />
      </svg>
    )
  }
];

/**
 * Passos da reserva. Sem cards: cada passo e separado por uma linha
 * tracejada vertical e marcado por uma barra rosa de acento.
 */
export function HowItWorks() {
  return (
    <section className="py-16 sm:py-20 px-5 sm:px-8">
      <div className="max-w-5xl mx-auto">
        <span className="font-display text-xs tracking-[0.22em] uppercase text-pink font-semibold">
          Passo a passo
        </span>
        <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight mt-3 mb-12">
          Como funciona
        </h2>

        <div className="grid gap-10 sm:grid-cols-3 sm:gap-0">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className={
                'relative sm:px-7 ' +
                (i === 0 ? 'sm:pl-0 ' : '') +
                (i === STEPS.length - 1 ? 'sm:pr-0 ' : '') +
                // separador tracejado entre as colunas
                (i > 0 ? 'sm:border-l sm:border-dashed sm:border-smoke' : '')
              }
            >
              <div className="flex items-start gap-3">
                <span className="mt-1 w-[3px] h-7 bg-pink shrink-0" aria-hidden="true" />
                <span className="text-navy">{s.icon}</span>
              </div>

              <h3 className="font-display font-semibold text-xl tracking-tight mt-5">
                {s.title}
              </h3>
              <p className="font-body text-[15px] leading-relaxed text-ash mt-2 max-w-[34ch]">
                {s.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
