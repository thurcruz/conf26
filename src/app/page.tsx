import Image from 'next/image';
import { Countdown } from '@/components/Countdown';
import { Background3D } from '@/components/Background3D';
import { ShirtPicker } from '@/components/ShirtPicker';
import { CartDrawer } from '@/components/CartDrawer';

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col">
      <Background3D />
      <Countdown />

      {/* Marquee strip */}
      <div className="bg-paper text-ink border-b-2 border-ink overflow-hidden">
        <div className="marquee-track py-2">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex items-center gap-8 px-4 font-display tracking-widest text-xl uppercase">
              <span>★ Conferência 2026</span>
              <span>·</span>
              <span>Até o Fim</span>
              <span>·</span>
              <span>Ministério Recarga</span>
              <span>·</span>
              <span>Adolescentes</span>
              <span>·</span>
              <span>31.07.2026 · 20h</span>
              <span>·</span>
              <span>★ Reserve sua camisa ★</span>
              <span>·</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-paper text-center">
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
        <p className="mt-6 max-w-xl mx-auto font-serif italic text-lg sm:text-xl">
          “…o que perseverar até o fim, esse será salvo.” — Mateus 24:13
        </p>
      </section>

      {/* Shirts */}
      <section id="camisas" className="bg-paper border-t-2 border-ink py-12 px-4">
        <header className="max-w-5xl mx-auto mb-8 text-center">
          <h2 className="font-display text-5xl sm:text-6xl tracking-wider uppercase">
            Camisa Oficial
          </h2>
          <p className="font-body text-base mt-2">
            Modelo Tradicional Unissex · Adulto R$ 50,00 · Infantil R$ 40,00
          </p>
        </header>

        <ShirtPicker />
      </section>

      {/* How it works */}
      <section className="bg-bone border-t-2 border-ink py-10 px-4">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-5">
          {[
            { n: '01', t: 'Escolha', d: 'Selecione cor, tamanho e tipo da sua camisa.' },
            { n: '02', t: 'Reserve', d: 'Pague 50% via PIX e envie o comprovante.' },
            { n: '03', t: 'Retire', d: 'Pague o restante e retire a camisa antes da conferência.' }
          ].map((s) => (
            <div key={s.n} className="v-card">
              <div className="font-display text-4xl">{s.n}</div>
              <div className="font-display text-2xl tracking-wider uppercase">{s.t}</div>
              <p className="font-body text-sm mt-2">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-ink text-paper text-center py-6 px-4 border-t-2 border-ink">
        <p className="font-display tracking-widest uppercase">
          Ministério Recarga · Adolescentes · 2026
        </p>
        <p className="font-body text-xs mt-1 opacity-70">
          © Conferência Até o Fim
        </p>
      </footer>

      <CartDrawer />
    </main>
  );
}
