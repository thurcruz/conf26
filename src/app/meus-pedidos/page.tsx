'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { EVENT, LOGOS } from '@/lib/products';
import { ReservaCard } from '@/components/ReservaCard';
import {
  esquecerReserva,
  esquecerTodasReservas,
  lembrarReserva,
  lerReservasLembradas,
  type ReservaConsulta
} from '@/lib/reserva';

/** Cada pedido na tela carrega o WhatsApp que o destravou (o upload precisa dele). */
type Linha = { reserva: ReservaConsulta; phone: string };

/** Junta sem duplicar: o que chega novo substitui o antigo, na mesma posicao. */
function mesclar(atual: Linha[], novas: Linha[]): Linha[] {
  const porProtocolo = new Map(atual.map((l) => [l.reserva.protocolo, l]));
  for (const l of novas) porProtocolo.set(l.reserva.protocolo, l);
  return [...porProtocolo.values()];
}

export default function MeusPedidosPage() {
  const [phone, setPhone] = useState('');
  const [protocolo, setProtocolo] = useState('');
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [restaurando, setRestaurando] = useState(true);
  const [temSessao, setTemSessao] = useState(false);
  const [formAberto, setFormAberto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const consultar = useCallback(async (p: string, code: string) => {
    const supabase = createClient();
    const { data, error: rpcErr } = await supabase.rpc('consultar_reservas', {
      p_phone: p,
      p_protocol: code
    });
    if (rpcErr) throw rpcErr;
    return (data ?? []) as ReservaConsulta[];
  }, []);

  // Sessao salva: abre os pedidos deste aparelho sem pedir nada.
  useEffect(() => {
    const salvos = lerReservasLembradas();
    if (salvos.length === 0) {
      setRestaurando(false);
      setFormAberto(true);
      return;
    }

    setTemSessao(true);
    setPhone(salvos[0].phone);

    let vivo = true;
    (async () => {
      const resultados = await Promise.all(
        salvos.map(async (s) => {
          try {
            const rs = await consultar(s.phone, s.protocolo);
            // Protocolo salvo que o banco nao reconhece mais: para de tentar.
            if (rs.length === 0) esquecerReserva(s.protocolo);
            return rs.map((r) => ({ reserva: r, phone: s.phone }));
          } catch {
            // Rede caiu: mantem salvo para a proxima visita.
            return [];
          }
        })
      );
      if (!vivo) return;

      const achados = mesclar([], resultados.flat());
      setLinhas(achados);
      setRestaurando(false);
      if (achados.length === 0) setFormAberto(true);
    })();

    return () => {
      vivo = false;
    };
  }, [consultar]);

  /** Recarrega um pedido depois do upload do comprovante. */
  const recarregar = useCallback(
    async (p: string, code: string) => {
      try {
        const rs = await consultar(p, code);
        setLinhas((atual) => mesclar(atual, rs.map((r) => ({ reserva: r, phone: p }))));
      } catch {
        /* silencioso: o card segue mostrando o que ja tinha */
      }
    },
    [consultar]
  );

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    const code = protocolo.trim().replace(/^#/, '').toUpperCase();
    if (digits.length < 8 || code.length < 8) {
      setError('Informe o WhatsApp completo e o nº do pedido (8 caracteres).');
      return;
    }

    setError(null);
    setNaoEncontrado(false);
    setLoading(true);
    try {
      const rs = await consultar(phone, code);
      if (rs.length === 0) {
        setNaoEncontrado(true);
        return;
      }
      lembrarReserva({ protocolo: code, phone });
      setTemSessao(true);
      setLinhas((atual) => mesclar(atual, rs.map((r) => ({ reserva: r, phone }))));
      setProtocolo('');
      setFormAberto(false);
    } catch (err: any) {
      setError(err?.message ?? 'Não foi possível consultar agora. Tente de novo.');
    } finally {
      setLoading(false);
    }
  }

  function sair() {
    esquecerTodasReservas();
    setTemSessao(false);
    setLinhas([]);
    setPhone('');
    setProtocolo('');
    setNaoEncontrado(false);
    setError(null);
    setFormAberto(true);
  }

  const mostrarForm = formAberto || (linhas.length === 0 && !restaurando);

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
          {linhas.length > 1 ? 'Meus pedidos' : 'Meu pedido'}
        </h1>
        <p className="font-body text-ash mt-3 max-w-xl">
          Consulte a situação da sua reserva e, se faltar, envie o comprovante do PIX por aqui.
        </p>

        {restaurando && (
          <p className="mt-8 font-body text-sm text-ash">Abrindo seus pedidos salvos...</p>
        )}

        {/* Sessao salva: a pessoa nao precisa digitar nada de novo */}
        {temSessao && linhas.length > 0 && (
          <div className="mt-7 border-l-2 border-smoke pl-4 py-1">
            <p className="font-body text-sm text-ash">
              Seus pedidos ficam <strong className="text-ink">salvos neste aparelho</strong> — na
              próxima vez eles abrem sozinhos.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {!mostrarForm && (
                <button
                  type="button"
                  onClick={() => setFormAberto(true)}
                  className="v-btn v-btn-sm"
                >
                  + Consultar outro pedido
                </button>
              )}
              <button type="button" onClick={sair} className="v-btn v-btn-sm v-btn-ghost">
                Esquecer meus dados
              </button>
            </div>
          </div>
        )}

        {/* Consulta */}
        {mostrarForm && (
          <>
            <form
              className="mt-8 grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end"
              onSubmit={buscar}
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
                Ele também está na mensagem que você mandou no WhatsApp da secretaria. Se não
                achar,{' '}
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
          </>
        )}

        {error && (
          <p className="mt-5 font-body text-sm text-pink-dark border-l-2 border-pink bg-pink-soft px-4 py-3 rounded-r-xl">
            {error}
          </p>
        )}

        {naoEncontrado && !loading && (
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

        {/* Resultado */}
        {linhas.map((l) => (
          <ReservaCard
            key={l.reserva.protocolo}
            reserva={l.reserva}
            phone={l.phone}
            onAtualizar={() => recarregar(l.phone, l.reserva.protocolo)}
          />
        ))}
      </div>
    </main>
  );
}
