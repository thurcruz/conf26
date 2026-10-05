import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { EVENT, PAST_EVENT } from '@/lib/products';

export const metadata: Metadata = {
  title: `${PAST_EVENT.name} — Arquivo | ${EVENT.ministry}`,
  description: `Memória da ${PAST_EVENT.tagline} do ${EVENT.ministry}.`,
  robots: { index: false }
};

export default function AteOFimPage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b border-smoke">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link href="/" className="v-btn v-btn-sm v-btn-ghost">
            ← {EVENT.name}
          </Link>
          <span className="font-body text-[11px] tracking-[0.2em] uppercase text-ash">
            Arquivo
          </span>
        </div>
      </header>

      {/* Capa com a arte original da conferência passada */}
      <section className="max-w-3xl mx-auto px-4 pt-10">
        <div className="relative aspect-[16/10] rounded-3xl overflow-hidden bg-ink">
          <Image
            src={PAST_EVENT.cover}
            alt={`Arte da Conferência ${PAST_EVENT.name}`}
            fill
            sizes="(min-width: 768px) 720px, 92vw"
            className="object-cover opacity-70"
            priority
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <div className="relative w-[min(60%,240px)] aspect-square">
              <Image
                src={PAST_EVENT.logo}
                alt={PAST_EVENT.name}
                fill
                sizes="240px"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-10 text-center">
        <p className="font-body text-[11px] tracking-[0.25em] uppercase text-ash">
          {PAST_EVENT.tagline}
        </p>
        <h1 className="font-display font-bold text-5xl sm:text-7xl tracking-tight uppercase mt-3">
          {PAST_EVENT.name}
        </h1>
        <p className="font-display text-lg tracking-[0.2em] uppercase mt-4 text-ash">
          {PAST_EVENT.dateLabel}
        </p>

        <blockquote className="serif italic text-xl sm:text-2xl text-graphite mt-10 max-w-xl mx-auto">
          {PAST_EVENT.verse}
          <footer className="font-body not-italic text-sm text-ash mt-3">
            — {PAST_EVENT.verseRef}
          </footer>
        </blockquote>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-10">
        <div className="v-card-soft">
          <h2 className="font-display font-bold text-2xl tracking-tight uppercase">
            O que ficou
          </h2>
          <p className="font-body text-sm sm:text-base text-graphite mt-3">
            A Conferência <strong>{PAST_EVENT.name}</strong> reuniu os adolescentes do{' '}
            {EVENT.ministry} em torno de uma única ideia: perseverar. O site de reservas
            de camisas, o countdown e a identidade visual daquela edição ficam guardados
            aqui como memória.
          </p>
          <p className="font-body text-sm sm:text-base text-graphite mt-3">
            As reservas desta edição estão encerradas. A conferência atual é a{' '}
            <Link href="/" className="underline hover:no-underline">
              {EVENT.name}
            </Link>
            , agora com os jovens.
          </p>
        </div>
      </section>

      {/* Galeria — pronta para receber as fotos do evento */}
      <section className="max-w-3xl mx-auto px-4 pb-14">
        <h2 className="font-display font-bold text-2xl tracking-tight uppercase mb-4">
          Galeria
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-2xl border border-dashed border-smoke bg-bone
                         flex items-center justify-center"
            >
              <span className="font-body text-[11px] tracking-widest uppercase text-ash">
                foto {i + 1}
              </span>
            </div>
          ))}
        </div>
        <p className="font-body text-xs text-ash mt-3">
          Adicione as fotos em <code>/public/historico/galeria/</code> e liste-as aqui.
        </p>
      </section>

      <footer className="border-t border-smoke py-10 px-4 text-center">
        <Link href="/" className="v-btn v-btn-pink">
          Ir para {EVENT.name}
        </Link>
        <p className="font-body text-xs mt-6 text-ash">
          {EVENT.ministry} · Arquivo da Conferência {PAST_EVENT.name}
        </p>
      </footer>
    </main>
  );
}
