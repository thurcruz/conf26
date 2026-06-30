import Image from 'next/image';

export function SizeChart() {
  return (
    <div className="glass-card max-w-3xl mx-auto">
      <h3 className="font-display text-3xl sm:text-4xl tracking-widest uppercase text-center border-b-2 border-paper pb-3 mb-4">
        Tabela de Medidas
      </h3>

      <div className="relative w-full aspect-square border-2 border-paper bg-white">
        <Image
          src="/TABELADA_DE_MEDIDAS.jpeg"
          alt="Tabela de medidas das camisas — tamanhos PP a XGG, largura e comprimento em cm"
          fill
          sizes="(min-width: 768px) 720px, 92vw"
          className="object-contain"
        />
      </div>

      <p className="font-body text-xs text-center mt-3 opacity-80">
        Margem de tolerância +/− 1 cm
      </p>
    </div>
  );
}
