'use client';

import { ProofUpload } from '@/components/ProofUpload';
import { EVENT } from '@/lib/products';
import { brl, statusView, type ReservaConsulta } from '@/lib/reserva';

export function ReservaCard({
  reserva,
  phone,
  onAtualizar
}: {
  reserva: ReservaConsulta;
  phone: string;
  onAtualizar: () => void;
}) {
  const sv = statusView(reserva);

  const toneClasses: Record<typeof sv.tone, string> = {
    acao: 'border-pink bg-pink-soft',
    neutro: 'border-ash bg-bone',
    ok: 'border-success bg-success-soft',
    cancelado: 'border-ash bg-bone'
  };
  const toneText: Record<typeof sv.tone, string> = {
    acao: 'text-pink-dark',
    neutro: 'text-ink',
    ok: 'text-success',
    cancelado: 'text-ash'
  };

  // Reserva cancelada nao tem "falta pagar" — cobrar algo ali confundiria.
  const faltaPagar =
    reserva.paid_in_full || reserva.status === 'cancelado'
      ? 0
      : Number(reserva.total_amount) - Number(reserva.reserve_amount);

  return (
    <article className="mt-8 v-card">
      <header className="flex flex-wrap items-baseline justify-between gap-2 pb-4 border-b border-smoke">
        <div>
          <p className="font-display text-[11px] tracking-[0.2em] uppercase text-ash">
            Protocolo
          </p>
          <p className="font-display font-bold text-2xl tracking-tight">#{reserva.protocolo}</p>
        </div>
        <p className="font-body text-sm text-ash">{reserva.full_name}</p>
      </header>

      {/* Situação */}
      <div className={`mt-5 border-l-2 pl-4 py-2 rounded-r-xl ${toneClasses[sv.tone]}`}>
        <p className={`font-display font-semibold ${toneText[sv.tone]}`}>{sv.label}</p>
        <p className="font-body text-sm text-ash mt-0.5">{sv.hint}</p>
      </div>

      {/* Itens */}
      <ul className="mt-5 divide-y divide-smoke">
        {reserva.items?.map((i, idx) => (
          <li key={idx} className="py-2.5 flex justify-between gap-3 font-body text-sm">
            <span>
              {i.qty}x Camisa {i.colorLabel} — {i.size} ({i.typeLabel})
            </span>
            <span className="shrink-0">{brl(i.unit_price * i.qty)}</span>
          </li>
        ))}
      </ul>

      <dl className="mt-4 pt-4 border-t border-smoke space-y-1.5 font-body text-sm">
        <div className="flex justify-between">
          <dt className="text-ash">Total</dt>
          <dd>{brl(reserva.total_amount)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ash">{reserva.paid_in_full ? 'Pago' : 'Pago na reserva'}</dt>
          <dd>{brl(reserva.reserve_amount)}</dd>
        </div>
        {faltaPagar > 0 && (
          <div className="flex justify-between font-display font-semibold text-base">
            <dt>Falta pagar na retirada</dt>
            <dd>{brl(faltaPagar)}</dd>
          </div>
        )}
      </dl>

      {/* Anexar comprovante quando falta */}
      {!reserva.tem_comprovante && reserva.status !== 'cancelado' && (
        <div className="mt-6 pt-5 border-t border-smoke">
          <p className="font-display font-semibold text-[11px] tracking-[0.18em] uppercase text-ash mb-3">
            Enviar comprovante
          </p>
          <ProofUpload
            protocolo={reserva.protocolo}
            phone={phone}
            onDone={onAtualizar}
            compact
          />
          <p className="font-body text-xs text-ash mt-3">
            Prefere mandar pelo WhatsApp?{' '}
            <a
              href={`https://wa.me/${EVENT.whatsapp}?text=${encodeURIComponent(
                `Olá! Segue o comprovante da reserva #${reserva.protocolo}.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="underline hover:no-underline"
            >
              Falar com a secretaria
            </a>
          </p>
        </div>
      )}
    </article>
  );
}
