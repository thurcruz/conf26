'use client';

import { useState } from 'react';
import Image from 'next/image';
import { COLORS, SIZES, TYPES, type ColorId, type Size, type TypeId } from '@/lib/products';
import { useCart } from '@/store/cart';

export function ShirtPicker() {
  return (
    <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
      {COLORS.map((c) => (
        <ShirtCard key={c.id} colorId={c.id} />
      ))}
    </div>
  );
}

function ShirtCard({ colorId }: { colorId: ColorId }) {
  const add = useCart((s) => s.add);
  const colorObj = COLORS.find((c) => c.id === colorId)!;
  const [side, setSide] = useState<'frente' | 'costas'>('frente');
  const [size, setSize] = useState<Size | null>(null);
  const [type, setType] = useState<TypeId>('adulto');
  const [added, setAdded] = useState(false);

  const typeObj = TYPES.find((t) => t.id === type)!;
  const img = side === 'frente' ? colorObj.frontImg : colorObj.backImg;

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
      <header className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-2xl sm:text-3xl tracking-wider uppercase">
          {colorObj.label}
        </h3>
        <span className="font-body text-sm">
          R$ {typeObj.price.toFixed(2).replace('.', ',')}
        </span>
      </header>

      <div className="relative aspect-square border-2 border-ink bg-white overflow-hidden">
        <Image
          src={img}
          alt={`Camisa ${colorObj.label} (${side})`}
          fill
          sizes="(min-width: 768px) 420px, 90vw"
          className="object-contain"
          priority
        />
        <div className="absolute bottom-2 left-2 right-2 flex justify-between gap-2">
          <button
            type="button"
            onClick={() => setSide('frente')}
            className={`v-chip ${side === 'frente' ? 'v-chip-active' : ''}`}
          >
            Frente
          </button>
          <button
            type="button"
            onClick={() => setSide('costas')}
            className={`v-chip ${side === 'costas' ? 'v-chip-active' : ''}`}
          >
            Costas
          </button>
        </div>
      </div>

      <div>
        <p className="font-display text-xs tracking-widest uppercase mb-1">Tipo</p>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id)}
              className={`v-chip ${type === t.id ? 'v-chip-active' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="font-display text-xs tracking-widest uppercase mb-1">Tamanho</p>
        <div className="flex flex-wrap gap-1.5">
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
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
        disabled={!size}
        className="v-btn w-full mt-1"
      >
        {added ? '✓ Adicionado' : 'Reservar'}
      </button>
    </div>
  );
}
