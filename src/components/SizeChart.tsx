import { SIZE_CHART } from '@/lib/products';

export function SizeChart() {
  return (
    <div className="glass-card max-w-3xl mx-auto">
      <h3 className="font-display text-3xl sm:text-4xl tracking-widest uppercase text-center border-b-2 border-paper pb-3 mb-4">
        Tabela de Medidas
      </h3>
      <p className="font-body text-sm text-center mb-4 opacity-80">
        Medidas em centímetros · camisa estendida sobre superfície plana
      </p>

      <div className="overflow-x-auto">
        <table className="w-full font-display text-lg sm:text-xl">
          <thead>
            <tr className="border-b-2 border-paper">
              <th className="text-left py-2 tracking-widest uppercase">Tamanho</th>
              <th className="text-right py-2 tracking-widest uppercase">
                Largura<span className="hidden sm:inline"> (peito)</span>
              </th>
              <th className="text-right py-2 tracking-widest uppercase">
                Comprimento
              </th>
            </tr>
          </thead>
          <tbody>
            {SIZE_CHART.map((row) => (
              <tr
                key={row.size}
                className="border-b border-paper/40 last:border-b-0"
              >
                <td className="py-2">{row.size}</td>
                <td className="py-2 text-right tabular-nums">{row.chest} cm</td>
                <td className="py-2 text-right tabular-nums">{row.length} cm</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="font-body text-xs text-center mt-4 opacity-70">
        Como medir: largura = de uma costura a outra, abaixo da manga ·
        comprimento = do ombro até a barra
      </p>
    </div>
  );
}
