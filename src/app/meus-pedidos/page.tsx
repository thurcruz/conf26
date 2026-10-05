'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { EVENT, LOGOS } from '@/lib/products';
import { ReservaCard } from '@/components/ReservaCard';
import { lerReservaLembrada, lembrarReserva, type ReservaConsulta } from '@/lib/reserva';

export default function MeusPedidosPage() {
  const [phone, setPhone] = useState('');
  const [protocolo, setProtocolo] = useState('');
  const [reservas, setReservas] = useState<ReservaConsulta[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscar = useCallback(
    async (p: string, proto: string, silencioso = false) => {
      const digits = p.replace(/\D/g, '');
      const code = proto.trim();
      if (digits.length < 8 || code.length < 8) {
        if (!silencioso) setError('Informe o WhatsApp completo e o nº do pedido (8 caracteres).');
        return;
      }

      setError(null);
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error: rpcErr } = await supabase.rpc('consultar_reservas', {
          p_phone: p,
          p_protocol: code
        });
        if (rpcErr) throw rpcErr;
        setReservas((data ?? []) as ReservaConsulta[]);
        if (data && data.length > 0) lembrarReserva({ protocolo: code, phone: p });
      } catch (err: any) {
        setError(err?.message ?? 'Não foi possível consultar agora. Tente de novo.');
        setReservas(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Se a pessoa acabou de reservar neste navegador, ja busca sozinho.
  useEffect(() => {
    const salvo = lerReservaLembrada();
    if (!salvo) return;
    setPhone(salvo.phone);
    setProtocolo(salvo.protocolo);
    buscar(salvo.phone, salvo.protocolo, true);
  }, [buscar]);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b border-smoke">
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="v-btn v-btn-sm v-btn-ghost">
            ← Voltar
          </Link>
          <div className="relative w-[132px] aspect-logo">
            <Image
              src={LOGOS.navy}
              alt={EVENT.name}
              fill
              sizes="132px"
              className="object-contain"
              priority
            />
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-10">
        <span className="font-display text-xs tracking-[0.22em] uppercase text-pink font-semibold">
          Acompanhe
        </span>
        <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight mt-3">
          Meu pedido
        </h1>
        <p className="font-body text-ash mt-3 max-w-xl">
          Consulte a situação da sua reserva e, se faltar, envie o comprovante do PIX por aqui.
        </p>

        {/* Consulta */}
        <form
          className="mt-8 grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end"
          onSubmit={(e) => {
            e.preventDefault();
            buscar(phone, protocolo);
          }}
        >
          <label className="block">
            <span className="font-display font-semibold text-[11px] tracking-[0.18em] uppercase text-ash">
              WhatsApp
            </span>
            <input
              className="v-input mt-1.5"
              placeholder="(21) 9 0000-0000"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="font-display font-semibold text-[11px] tracking-[0.18em] uppercase text-ash">
              Nº do pedido
            </span>
            <input
              className="v-input mt-1.5 uppercase"
              placeholder="A1B2C3D4"
              value={protocolo}
              onChange={(e) => setProtocolo(e.target.value.replace(/^#/, '').toUpperCase())}
            />
          </label>
          <button type="submit" disabled={loading} className="v-btn v-btn-dark h-[46px]">
            {loading ? 'Buscando...' : 'Consultar'}
          </button>
        </form>

        <div className="mt-4 border-l-2 border-smoke pl-4 py-1 max-w-xl">
          <p className="font-body text-sm text-ash">
            <strong className="text-ink">O que é o nº do pedido?</strong> É o código de 8
            caracteres que apareceu quando você finalizou a reserva (algo como{' '}
            <span className="font-display font-semibold text-ink">#A1B2C3D4</span>).
          </p>
          <p className="font-body text-sm text-ash mt-1.5">
            Ele também está na mensagem que você mandou no WhatsApp da secretaria. Se não achar,{' '}
            <a
              href={`https://wa.me/${EVENT.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="underline hover:no-underline text-ink"
            >
              peça para a secretaria
            </a>{' '}
            — ela consegue ver o seu número lá no painel.
          </p>
        </div>

        {error && (
          <p className="mt-5 font-body text-sm text-pink-dark border-l-2 border-pink bg-pink-soft px-4 py-3 rounded-r-xl">
            {error}
          </p>
        )}

        {/* Resultado */}
        {reservas !== null && reservas.length === 0 && !loading && (
          <div className="mt-8 border-l-2 border-smoke pl-5 py-1">
            <p className="font-display font-semibold">Nenhuma reserva encontrada</p>
            <p className="font-body text-sm text-ash mt-1">
              Confira se o WhatsApp é o mesmo que você usou na reserva e se o protocolo está
              certo. Se continuar sem achar,{' '}
              <a
                href={`https://wa.me/${EVENT.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="underline hover:no-underline"
              >
                fale com a secretaria
              </a>
              .
            </p>
          </div>
        )}

        {reservas?.map((r) => (
          <ReservaCard
            key={r.protocolo}
            reserva={r}
            phone={phone}
            onAtualizar={() => buscar(phone, protocolo, true)}
          />
        ))}
      </div>
    </main>
  );
}
