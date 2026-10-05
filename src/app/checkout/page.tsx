'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/store/cart';
import { EVENT, LOGOS } from '@/lib/products';
import { ProofBanner } from '@/components/ProofBanner';
import { ProofUpload } from '@/components/ProofUpload';
import { lembrarReserva, protocoloDe } from '@/lib/reserva';
import { ProtocoloDestaque } from '@/components/Protocolo';
import { createClient } from '@/lib/supabase/client';

function brl(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total());
  const reserve = useCart((s) => s.reserve());
  const clear = useCart((s) => s.clear);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [payMode, setPayMode] = useState<'reserve' | 'full'>('reserve');
  const [file, setFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{
    id: string;
    whatsappLink: string;
    temComprovante: boolean;
  } | null>(null);
  const [salesPaused, setSalesPaused] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('settings')
      .select('sales_paused')
      .eq('id', true)
      .single()
      .then(({ data }) => setSalesPaused(data?.sales_paused ?? false));
  }, []);

  const payNow = payMode === 'full' ? total : reserve;

  function copyPix() {
    navigator.clipboard.writeText(EVENT.pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSubmit(mode: 'upload' | 'whatsapp') {
    setError(null);
    if (!name.trim() || !phone.trim()) {
      setError('Preencha nome e telefone.');
      return;
    }
    if (items.length === 0) {
      setError('Carrinho vazio.');
      return;
    }
    if (mode === 'upload' && !file) {
      setError('Anexe o comprovante ou escolha a opção WhatsApp.');
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();

      let payment_proof_url: string | null = null;
      if (mode === 'upload' && file) {
        const path = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const up = await supabase.storage.from('comprovantes').upload(path, file);
        if (up.error) throw up.error;
        const { data: pub } = supabase.storage.from('comprovantes').getPublicUrl(path);
        payment_proof_url = pub.publicUrl;
      }

      const reservationId = crypto.randomUUID();
      const { error: insErr } = await supabase.from('reservations').insert({
        id: reservationId,
        full_name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        items: items.map((i) => ({
          color: i.color,
          colorLabel: i.colorLabel,
          size: i.size,
          type: i.type,
          typeLabel: i.typeLabel,
          qty: i.qty,
          unit_price: i.unitPrice
        })),
        total_amount: total,
        reserve_amount: payNow,
        paid_in_full: payMode === 'full',
        payment_proof_url,
        whatsapp_sent: mode === 'whatsapp'
      });

      if (insErr) throw insErr;

      const summary = items
        .map((i) => `• ${i.qty}x ${i.colorLabel} — ${i.size} (${i.typeLabel})`)
        .join('\n');
      const msg = encodeURIComponent(
        `Olá! Acabei de fazer uma reserva da camisa da Conferência ${EVENT.name}.\n\n` +
          `Nome: ${name}\nTelefone: ${phone}\nNº do pedido: #${protocoloDe(reservationId)}\n\n` +
          `Itens:\n${summary}\n\nTotal: ${brl(total)}\n` +
          (payMode === 'full'
            ? `Pago integralmente: ${brl(total)}\n\n`
            : `Reserva (50%): ${brl(reserve)}\n\n`) +
          (mode === 'whatsapp'
            ? 'Vou enviar o comprovante do PIX por aqui.'
            : 'Comprovante já anexado no site.') +
          `\n\nAcompanhe em: ${
            typeof window !== 'undefined' ? window.location.origin : ''
          }/meus-pedidos`
      );
      const link = `https://wa.me/${EVENT.whatsapp}?text=${msg}`;

      clear();
      lembrarReserva({ protocolo: protocoloDe(reservationId), phone: phone.trim() });
      setDone({
        id: reservationId,
        whatsappLink: link,
        temComprovante: payment_proof_url !== null
      });
      if (mode === 'whatsapp') {
        // Nova aba de proposito: se trocarmos a pagina, a pessoa perde o protocolo
        // e o campo de anexar comprovante — que e justamente o que falta fazer.
        window.open(link, '_blank', 'noopener');
      }
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao enviar reserva.');
    } finally {
      setSubmitting(false);
    }
  }

  if (salesPaused === null) {
    return <main className="min-h-screen bg-paper" />;
  }

  if (salesPaused) {
    return (
      <main className="min-h-screen bg-paper text-ink flex items-center justify-center p-6">
        <div className="v-card max-w-lg w-full text-center">
          <h1 className="font-display font-bold text-4xl tracking-tight uppercase">Reservas indisponíveis</h1>
          <p className="font-body mt-3">
            As reservas de camisas não estão mais disponíveis no momento. Fique de olho nos
            avisos da secretaria para novidades.
          </p>
          <Link href="/" className="v-btn v-btn-dark w-full mt-5">
            Voltar para o início
          </Link>
        </div>
      </main>
    );
  }

  if (done) {
    const protocolo = protocoloDe(done.id);
    return (
      <main className="min-h-screen bg-paper text-ink flex items-center justify-center p-5 py-10">
        <div className="v-card max-w-lg w-full">
          <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight">
            Reserva registrada
          </h1>

          <div className="mt-5 pb-5 border-b border-smoke">
            <ProtocoloDestaque protocolo={protocolo} />
            <div className="mt-3 border-l-2 border-smoke pl-4 py-1">
              <p className="font-body text-sm text-ash">
                <strong className="text-ink">Guarde este número.</strong> É ele que identifica
                a sua reserva: com ele você acompanha o pedido aqui no site e a secretaria
                encontra a sua camisa.
              </p>
              <p className="font-body text-sm text-ash mt-1.5">
                Ele também já vai na mensagem do WhatsApp, então você não precisa decorar —
                mas copiar aqui não custa nada.
              </p>
            </div>
          </div>

          {done.temComprovante ? (
            <div className="mt-5 border-l-2 border-success bg-success-soft pl-4 py-3 rounded-r-xl">
              <p className="font-display font-semibold text-success">Comprovante recebido</p>
              <p className="font-body text-sm text-ash mt-0.5">
                A secretaria vai conferir e confirmar sua reserva.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-5 border-l-2 border-pink bg-pink-soft pl-4 py-3 rounded-r-xl">
                <p className="font-display font-semibold text-pink-dark">
                  Falta o comprovante
                </p>
                <p className="font-body text-sm text-ash mt-0.5">
                  Sua camisa <strong>ainda não está garantida</strong>. Envie o comprovante do
                  PIX agora — aqui mesmo ou pelo WhatsApp.
                </p>
              </div>

              <div className="mt-5">
                <p className="font-display font-semibold text-[11px] tracking-[0.18em] uppercase text-ash mb-2.5">
                  Anexar agora
                </p>
                <ProofUpload protocolo={protocolo} phone={phone.trim()} compact />
              </div>

              <a
                href={done.whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="v-btn w-full mt-3"
              >
                Enviar pelo WhatsApp
              </a>
            </>
          )}

          <div className="mt-6 pt-5 border-t border-smoke flex flex-col sm:flex-row gap-3">
            <Link href="/meus-pedidos" className="v-btn v-btn-dark flex-1">
              Acompanhar meu pedido
            </Link>
            <Link href="/" className="v-btn flex-1">
              Voltar para o início
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <ProofBanner />

      <header className="border-b border-smoke bg-white/90 backdrop-blur-md sticky top-11 sm:top-12 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="v-btn v-btn-sm v-btn-ghost">← Voltar</Link>
          <div className="relative w-[132px] aspect-logo">
            <Image src={LOGOS.navy} alt={EVENT.name} fill sizes="132px" className="object-contain" priority />
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Items recap */}
        <section className="v-card">
          <h2 className="font-display font-bold text-2xl tracking-tight uppercase border-b border-smoke pb-2 mb-3">
            Seus itens
          </h2>
          {items.length === 0 ? (
            <p className="font-body">
              Carrinho vazio. <Link href="/" className="underline">Escolha sua camisa</Link>.
            </p>
          ) : (
            <ul className="divide-y divide-smoke">
              {items.map((i) => (
                <li key={i.id} className="py-2 flex justify-between font-body">
                  <span>
                    {i.qty}x Camisa {i.colorLabel} — {i.size} ({i.typeLabel})
                  </span>
                  <span>{brl(i.unitPrice * i.qty)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 pt-3 border-t border-smoke flex justify-between font-display text-xl uppercase">
            <span>Total</span>
            <span>{brl(total)}</span>
          </div>

          <div className="mt-3 pt-3 border-t border-smoke">
            <p className="font-display font-semibold tracking-widest uppercase text-sm mb-2">
              Como quer pagar?
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPayMode('reserve')}
                className={`v-chip w-full justify-between !py-3 ${
                  payMode === 'reserve' ? 'v-chip-active' : ''
                }`}
              >
                <span>Reserva 50%</span>
                <strong>{brl(reserve)}</strong>
              </button>
              <button
                type="button"
                onClick={() => setPayMode('full')}
                className={`v-chip w-full justify-between !py-3 ${
                  payMode === 'full' ? 'v-chip-active' : ''
                }`}
              >
                <span>Pagar tudo</span>
                <strong>{brl(total)}</strong>
              </button>
            </div>
            <p className="font-body text-xs mt-2 opacity-80">
              {payMode === 'reserve'
                ? 'Você paga 50% agora e o restante na retirada da camisa.'
                : 'Você paga o valor total agora. Nada a pagar na retirada.'}
            </p>
          </div>

          <div className="mt-3 flex justify-between font-display text-2xl uppercase">
            <span>Pagar agora</span>
            <span>{brl(payNow)}</span>
          </div>
        </section>

        {/* Dados */}
        <section className="v-card">
          <h2 className="font-display font-bold text-2xl tracking-tight uppercase border-b border-smoke pb-2 mb-3">
            Seus dados
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block sm:col-span-2">
              <span className="font-display font-semibold tracking-widest uppercase text-sm">Nome completo *</span>
              <input className="v-input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="block">
              <span className="font-display font-semibold tracking-widest uppercase text-sm">WhatsApp *</span>
              <input className="v-input mt-1" placeholder="(21) 9 0000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label className="block">
              <span className="font-display font-semibold tracking-widest uppercase text-sm">E-mail</span>
              <input className="v-input mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
          </div>
        </section>

        {/* PIX */}
        <section className="v-card">
          <h2 className="font-display font-bold text-2xl tracking-tight uppercase border-b border-smoke pb-2 mb-3">
            Pague {brl(payNow)} via PIX
          </h2>
          <p className="font-body text-sm mb-2">Chave PIX (CNPJ):</p>
          <div className="flex gap-2 items-stretch">
            <code className="flex-1 v-input font-body text-lg flex items-center">{EVENT.pixKey}</code>
            <button type="button" onClick={copyPix} className="v-btn v-btn-dark">
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
          <p className="font-body text-sm mt-2">
            Beneficiário: <strong>{EVENT.pixName}</strong>
          </p>
          <p className="font-body text-sm">
            Endereço: <strong>{EVENT.pixAddress}</strong>
          </p>
        </section>

        {/* Comprovante */}
        <section className="v-card">
          <h2 className="font-display font-bold text-2xl tracking-tight uppercase border-b border-smoke pb-2 mb-3">
            Envie o comprovante
          </h2>
          <p className="font-body text-sm mb-3">
            Para confirmar sua reserva, anexe o comprovante do PIX abaixo <em>OU</em> envie diretamente pelo WhatsApp.
          </p>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="v-input"
          />
          {file && (
            <p className="font-body text-sm mt-2">
              Selecionado: <strong>{file.name}</strong>
            </p>
          )}

          {error && (
            <div className="mt-3 rounded-2xl border border-pink bg-pink-soft text-pink-dark px-4 py-2.5 font-body text-sm">
              ⚠ {error}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            <button
              type="button"
              disabled={submitting || items.length === 0}
              onClick={() => handleSubmit('upload')}
              className="v-btn v-btn-pink"
            >
              {submitting ? 'Enviando...' : 'Enviar reserva com comprovante'}
            </button>
            <button
              type="button"
              disabled={submitting || items.length === 0}
              onClick={() => handleSubmit('whatsapp')}
              className="v-btn v-btn-dark"
            >
              Enviar pelo WhatsApp
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
