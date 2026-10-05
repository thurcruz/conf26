import Image from 'next/image';
import Link from 'next/link';
import { Countdown } from '@/components/Countdown';
import { ProofBanner } from '@/components/ProofBanner';
import { ShirtPicker } from '@/components/ShirtPicker';
import { SizeChart } from '@/components/SizeChart';
import { CartDrawer } from '@/components/CartDrawer';
import { HowItWorks } from '@/components/HowItWorks';
import { EVENT, LOGOS, RECARGA_LOGO, WORSHIP_IMAGE } from '@/lib/products';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = createClient();
  const { data: settings } = await supabase
    .from('settings')
    .select('sales_paused')
    .eq('id', true)
    .single();
  const salesPaused = settings?.sales_paused ?? false;

  return (
    <main className="min-h-screen flex flex-col bg-paper text-ink">
      {/* ---------- Faixa rosa: aviso do comprovante (topo da tela) ---------- */}
      <ProofBanner />

      {/* ---------- Hero (azul-marinho) ---------- */}
      <section className="relative bg-navy text-white">
        {/* Foto de adoração: metade direita no desktop, cobrindo toda a altura. */}
        <div className="absolute inset-y-0 right-0 hidden lg:block w-1/2">
          <Image
            src={WORSHIP_IMAGE}
            alt="Momento de adoração na conferência"
            fill
            sizes="50vw"
            className="object-cover"
            priority
          />
          {/* Degradê para o texto respirar na emenda com o azul */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-navy via-navy/35 to-transparent"
            aria-hidden="true"
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 lg:grid lg:grid-cols-2">
          {/* No desktop o texto ocupa a altura da tela (menos a faixa rosa);
              no mobile segue a altura natural para nao somar com a foto abaixo. */}
          <div className="flex flex-col justify-center pt-20 pb-14 lg:py-28 lg:pr-12 lg:min-h-[calc(100svh-3rem)]">
            {/* Logo pequena, branca */}
            <div className="relative w-[210px] sm:w-[250px] aspect-logo">
              <Image
                src={LOGOS.white}
                alt={`${EVENT.name} — ${EVENT.ministry}`}
                fill
                sizes="250px"
                className="object-contain"
                priority
              />
            </div>

            <p className="mt-7 font-display font-medium text-sm tracking-[0.2em] uppercase text-pink">
              {EVENT.tagline}
            </p>

            <h1 className="mt-5 max-w-[16ch] font-display font-bold text-[2.6rem] leading-[1.05] sm:text-[3.4rem] sm:leading-[1.03] tracking-tight text-balance">
              Existe muito mais acontecendo do que o que se vê de fora.
            </h1>

            <p className="mt-6 max-w-md font-body text-lg text-white/70 leading-relaxed">
              Por trás da luz, do som e da multidão, existe um encontro real... e é
              para esse encontro que estamos chamando você.
            </p>

            {/* Data e local — sem caixas */}
            <div className="mt-10 flex flex-col gap-5 sm:flex-row sm:gap-10">
              <div>
                <p className="font-display text-[11px] tracking-[0.2em] uppercase text-white/40">
                  Quando
                </p>
                <p className="mt-1.5 font-display font-semibold text-lg">
                  {EVENT.dateLabel}
                </p>
              </div>
              <div className="sm:border-l sm:border-white/15 sm:pl-10">
                <p className="font-display text-[11px] tracking-[0.2em] uppercase text-white/40">
                  Onde
                </p>
                <p className="mt-1.5 font-display font-semibold text-lg">{EVENT.venue}</p>
                <p className="font-body text-sm text-white/55">{EVENT.venueAddress}</p>
              </div>
            </div>

            <div className="mt-8 pt-7 border-t border-white/10 max-w-sm">
              <Countdown />
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <a href="#camisas" className="v-btn v-btn-pink">
                Reservar minha camisa
              </a>
              <a
                href={`https://wa.me/${EVENT.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="v-btn v-btn-outline-light"
              >
                Falar com a secretaria
              </a>
            </div>
          </div>

          {/* Foto no mobile/tablet: abaixo do texto, largura cheia */}
          <div className="relative lg:hidden -mx-5 sm:-mx-8 h-[55svh]">
            <Image
              src={WORSHIP_IMAGE}
              alt="Momento de adoração na conferência"
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-navy/60"
              aria-hidden="true"
            />
          </div>
        </div>
      </section>

      {/* ---------- Camisas (branco) ---------- */}
      <section id="camisas" className="bg-paper py-16 sm:py-20 px-4">
        <header className="max-w-5xl mx-auto mb-10">
          <span className="font-display text-xs tracking-[0.22em] uppercase text-pink font-semibold">
            Camisa oficial
          </span>
          <h2 className="font-display font-bold text-4xl sm:text-5xl tracking-tight mt-3">
            Garanta a sua
          </h2>
          <p className="font-body text-base mt-3 text-ash">
            Infantil R$ 40,00 · Casual R$ 50,00 · Oversize R$ 60,00
          </p>
        </header>

        {salesPaused && (
          <div className="max-w-5xl mx-auto mb-8 border-l-2 border-pink bg-pink-soft px-5 py-4">
            <p className="font-display font-semibold">Reservas indisponíveis no momento</p>
            <p className="font-body text-sm mt-1 text-ash">
              Fique de olho nos avisos da secretaria para novidades.
            </p>
          </div>
        )}

        <ShirtPicker salesPaused={salesPaused} />
      </section>

      {/* ---------- Tabela de medidas ---------- */}
      <section className="py-14 px-4 bg-bone">
        <SizeChart />
      </section>

      {/* ---------- Como funciona ---------- */}
      <HowItWorks />

      {/* ---------- Footer (azul-marinho) ---------- */}
      <footer className="bg-navy text-white py-14 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-4">
              <div className="relative w-[190px] aspect-logo">
                <Image
                  src={LOGOS.white}
                  alt={EVENT.name}
                  fill
                  sizes="190px"
                  className="object-contain"
                />
              </div>
              <span aria-hidden className="h-10 w-px bg-white/25" />
              <div className="relative h-11 w-[49px] shrink-0">
                <Image
                  src={RECARGA_LOGO}
                  alt={EVENT.ministry}
                  fill
                  sizes="50px"
                  className="object-contain"
                />
              </div>
            </div>
            <p className="font-body text-sm mt-4 text-white/60">
              {EVENT.dateLabel} · {EVENT.venue}
            </p>
            <p className="font-body text-sm text-white/40">{EVENT.venueAddress}</p>
          </div>

          <div className="sm:text-right">
            <p className="font-display font-semibold text-sm tracking-tight">
              {EVENT.ministry}
            </p>
            <div className="flex flex-col sm:items-end gap-1 mt-1">
              <Link
                href="/meus-pedidos"
                className="font-body text-sm text-white/60 underline hover:no-underline hover:text-pink"
              >
                Acompanhar meu pedido
              </Link>
              <a
                href={`https://wa.me/${EVENT.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="font-body text-sm text-white/60 underline hover:no-underline hover:text-pink"
              >
                Falar com a secretaria
              </a>
            </div>
            <p className="font-body text-xs mt-5 text-white/40">
              Feito com muito código, café e Jesus por{' '}
              <a
                href="https://instagram.com/thurdacruz"
                target="_blank"
                rel="noreferrer"
                className="underline hover:no-underline hover:text-pink"
              >
                @thurdacruz
              </a>
            </p>
          </div>
        </div>
      </footer>

      <CartDrawer salesPaused={salesPaused} />
    </main>
  );
}
