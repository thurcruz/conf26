import Image from 'next/image';
import { Countdown } from '@/components/Countdown';
import { Background3D } from '@/components/Background3D';
import { ShirtPicker } from '@/components/ShirtPicker';
import { SizeChart } from '@/components/SizeChart';
import { CartDrawer } from '@/components/CartDrawer';
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
    <main className="relative min-h-screen flex flex-col text-paper">
      <Background3D />

      <Countdown />

      <div className="relative z-10 flex-1 flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
        <div className="relative w-[min(86vw,520px)] aspect-square">
          <Image
            src="/logo.png"
            alt="Conferência 2026 — Até o Fim"
            fill
            sizes="(min-width: 768px) 520px, 86vw"
            className="object-contain drop-shadow-[4px_4px_0_rgba(0,0,0,0.85)]"
            priority
          />
        </div>
        <p className="mt-6 max-w-xl mx-auto font-serif italic text-lg sm:text-xl drop-shadow-[2px_2px_0_rgba(0,0,0,0.85)]">
          “…o que perseverar até o fim, esse será salvo.” — Mateus 24:13
        </p>
      </section>

      {/* Shirts */}
      <section id="camisas" className="py-12 px-4">
        <header className="max-w-5xl mx-auto mb-8 text-center">
          <h2 className="font-display text-5xl sm:text-6xl tracking-wider uppercase drop-shadow-[3px_3px_0_rgba(0,0,0,0.85)]">
            Camisa Oficial
          </h2>
          <p className="font-body text-base mt-2 drop-shadow-[2px_2px_0_rgba(0,0,0,0.85)]">
            Infantil R$ 40,00 · Casual R$ 50,00 · Oversize R$ 60,00
          </p>
        </header>

        {salesPaused && (
          <div className="max-w-3xl mx-auto mb-6 v-card text-center">
            <p className="font-display tracking-widest uppercase">
              ⚠ Reservas indisponíveis no momento
            </p>
            <p className="font-body text-sm mt-1">
              Fique de olho nos avisos da secretaria para novidades.
            </p>
          </div>
        )}

        <ShirtPicker salesPaused={salesPaused} />
      </section>

      {/* Tabela de medidas */}
      <section className="py-10 px-4">
        <SizeChart />
      </section>

      {/* How it works */}
      <section className="py-10 px-4">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-5">
          {[
            { n: '01', t: 'Escolha', d: 'Selecione cor, tamanho e tipo da sua camisa.' },
            { n: '02', t: 'Reserve', d: 'Pague 50% via PIX e envie o comprovante.' },
            { n: '03', t: 'Retire', d: 'Pague o restante e retire a camisa antes da conferência.' }
          ].map((s) => (
            <div key={s.n} className="v-card text-ink">
              <div className="font-display text-4xl">{s.n}</div>
              <div className="font-display text-2xl tracking-wider uppercase">{s.t}</div>
              <p className="font-body text-sm mt-2">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center py-6 px-4">
        <p className="font-display tracking-widest uppercase drop-shadow-[2px_2px_0_rgba(0,0,0,0.85)]">
          Ministério Recarga · Adolescentes · 2026
        </p>
        <p className="font-body text-xs mt-1 opacity-80 drop-shadow-[1px_1px_0_rgba(0,0,0,0.85)]">
          © Conferência Até o Fim
        </p>
        <p className="font-body text-xs mt-3 opacity-90 drop-shadow-[1px_1px_0_rgba(0,0,0,0.85)]">
          Feito com muito código, café e Jesus por{' '}
          <a
            href="https://instagram.com/acruzcompany"
            target="_blank"
            rel="noreferrer"
            className="underline hover:no-underline"
          >
            @acruzcompany
          </a>{' '}
          &amp;{' '}
          <a
            href="https://instagram.com/recargacrtv"
            target="_blank"
            rel="noreferrer"
            className="underline hover:no-underline"
          >
            @recargacrtv
          </a>
        </p>
      </footer>
      </div>

      <CartDrawer salesPaused={salesPaused} />
    </main>
  );
}
