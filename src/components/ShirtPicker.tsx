'use client';

import { useState } from 'react';
import { COLORS, TYPES, sizesForType, type ColorId, type Size, type TypeId } from '@/lib/products';
import { ShirtViewer } from '@/components/ShirtViewer';
import { useCart } from '@/store/cart';

export function ShirtPicker({ salesPaused = false }: { salesPaused?: boolean }) {
  return (
    <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
      {COLORS.map((c) => (
        <ShirtCard key={c.id} colorId={c.id} salesPaused={salesPaused} />
      ))}
    </div>
  );
}

function ShirtCard({ colorId, salesPaused }: { colorId: ColorId; salesPaused: boolean }) {
  const add = useCart((s) => s.add);
  const colorObj = COLORS.find((c) => c.id === colorId)!;
  const [size, setSize] = useState<Size | null>(null);
  const [type, setType] = useState<TypeId>('casual');
  const [added, setAdded] = useState(false);

  const typeObj = TYPES.find((t) => t.id === type)!;
  const availableSizes = sizesForType(type);

  function handleTypeChange(newType: TypeId) {
    setType(newType);
    const newSizes = sizesForType(newType);
    if (size && !newSizes.includes(size)) setSize(null);
  }

  function handleAdd() {
    if (!size) return;
    add({
      color: colorId,
      colorLabel: colorObj.label,
      size,
      type,
      typeLabel: typeObj.label,
      unitPrice: typeObj.price
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  return (
    <div className="v-card flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Circulo com a cor real do tecido */}
          <span
            className="w-5 h-5 rounded-full border border-smoke shrink-0 shadow-soft-sm"
            style={{ backgroundColor: colorObj.swatch }}
            aria-hidden="true"
          />
          <h3 className="font-display font-bold text-2xl sm:text-3xl tracking-tight truncate">
            {colorObj.label}
          </h3>
        </div>
        <span className="font-display font-semibold text-sm text-pink shrink-0">
          R$ {typeObj.price.toFixed(2).replace('.', ',')}
        </span>
      </header>

      <ShirtViewer
        label={colorObj.label}
        frontImg={colorObj.frontImg}
        backImg={colorObj.backImg}
      />

      <div>
        <p className="font-display font-semibold text-[11px] tracking-[0.18em] uppercase mb-2 text-ash">Modelo</p>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleTypeChange(t.id)}
              className={`v-chip ${type === t.id ? 'v-chip-active' : ''}`}
            >
              {t.label} · R$ {t.price.toFixed(2).replace('.', ',')}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="font-display font-semibold text-[11px] tracking-[0.18em] uppercase mb-2 text-ash">
          Tamanho {type === 'infantil' && <span className="opacity-70">(anos)</span>}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {availableSizes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s as Size)}
              className={`v-chip min-w-[2.75rem] ${size === s ? 'v-chip-active' : ''}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={!size || salesPaused}
        className="v-btn v-btn-pink w-full mt-2"
      >
        {salesPaused ? 'Reservas indisponíveis' : added ? '✓ Adicionado' : 'Adicionar ao carrinho'}
      </button>
    </div>
  );
}
