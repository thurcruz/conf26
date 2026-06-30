'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/store/cart';
import { EVENT } from '@/lib/products';
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
  const [file, setFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ id: string; whatsappLink: string } | null>(null);

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

      const { data, error: insErr } = await supabase
        .from('reservations')
        .insert({
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
          reserve_amount: reserve,
          payment_proof_url,
          whatsapp_sent: mode === 'whatsapp'
        })
        .select('id')
        .single();

      if (insErr) throw insErr;

      const summary = items
        .map((i) => `• ${i.qty}x ${i.colorLabel} — ${i.size} (${i.typeLabel})`)
        .join('\n');
      const msg = encodeURIComponent(
        `Olá! Acabei de fazer uma reserva da camisa da Conferência 2026.\n\n` +
          `Nome: ${name}\nTelefone: ${phone}\nReserva #${data.id.slice(0, 8)}\n\n` +
          `Itens:\n${summary}\n\nTotal: ${brl(total)}\nReserva (50%): ${brl(reserve)}\n\n` +
          (mode === 'whatsapp'
            ? 'Vou enviar o comprovante do PIX por aqui.'
            : 'Comprovante já anexado no site.')
      );
      const link = `https://wa.me/${EVENT.whatsapp}?text=${msg}`;

      clear();
      setDone({ id: data.id, whatsappLink: link });
      if (mode === 'whatsapp') {
        window.location.href = link;
      }
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao enviar reserva.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen bg-paper text-ink flex items-center justify-center p-6">
        <div className="v-card max-w-lg w-full text-center">
          <h1 className="font-display text-4xl tracking-widest uppercase">Reserva enviada!</h1>
          <p className="font-body mt-3">
            Protocolo <strong>#{done.id.slice(0, 8).toUpperCase()}</strong>
          </p>
          <p className="font-body mt-3">
            Sua reserva foi registrada. Em breve a secretaria entrará em contato pelo WhatsApp
            para confirmar.
          </p>
          <a href={done.whatsappLink} target="_blank" rel="noreferrer" className="v-btn v-btn-dark w-full mt-5">
            Falar com a secretaria
          </a>
          <Link href="/" className="v-btn w-full mt-2">Voltar ao início</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="bg-ink text-paper border-b-2 border-ink">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-display tracking-widest uppercase">← Voltar</Link>
          <span className="font-display tracking-widest uppercase">Reserva</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Items recap */}
        <section className="v-card">
          <h2 className="font-display text-2xl tracking-widest uppercase border-b-2 border-ink pb-2 mb-3">
            Seus itens
          </h2>
          {items.length === 0 ? (
            <p className="font-body">
              Carrinho vazio. <Link href="/" className="underline">Escolha sua camisa</Link>.
            </p>
          ) : (
            <ul className="divide-y-2 divide-ink">
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
          <div className="mt-3 pt-3 border-t-2 border-ink flex justify-between font-display text-xl uppercase">
            <span>Total</span>
            <span>{brl(total)}</span>
          </div>
          <div className="flex justify-between font-display text-2xl uppercase">
            <span>Pagar agora (50%)</span>
            <span>{brl(reserve)}</span>
          </div>
        </section>

        {/* Dados */}
        <section className="v-card">
          <h2 className="font-display text-2xl tracking-widest uppercase border-b-2 border-ink pb-2 mb-3">
            Seus dados
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block sm:col-span-2">
              <span className="font-display tracking-widest uppercase text-sm">Nome completo *</span>
              <input className="v-input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="block">
              <span className="font-display tracking-widest uppercase text-sm">WhatsApp *</span>
              <input className="v-input mt-1" placeholder="(21) 9 0000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label className="block">
              <span className="font-display tracking-widest uppercase text-sm">E-mail</span>
              <input className="v-input mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
          </div>
        </section>

        {/* PIX */}
        <section className="v-card">
          <h2 className="font-display text-2xl tracking-widest uppercase border-b-2 border-ink pb-2 mb-3">
            Pague {brl(reserve)} via PIX
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
        </section>

        {/* Comprovante */}
        <section className="v-card">
          <h2 className="font-display text-2xl tracking-widest uppercase border-b-2 border-ink pb-2 mb-3">
            Envie o comprovante
          </h2>
          <p className="font-body text-sm mb-3">
            Anexe o comprovante do PIX abaixo <em>OU</em> envie diretamente pelo WhatsApp.
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
            <div className="mt-3 border-2 border-ink bg-bone p-2 font-body text-sm">
              ⚠ {error}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            <button
              type="button"
              disabled={submitting || items.length === 0}
              onClick={() => handleSubmit('upload')}
              className="v-btn"
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
