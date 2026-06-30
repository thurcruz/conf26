'use client';

import { useState } from 'react';
import Image from 'next/image';
import { COLORS, SIZES, TYPES, type ColorId, type Size, type TypeId } from '@/lib/products';
import { useCart } from '@/store/cart';

export function ShirtPicker() {
  const add = useCart((s) => s.add);
  const [color, setColor] = useState<ColorId>(COLORS[0].id);
  const [size, setSize] = useState<Size | null>(null);
  const [type, setType] = useState<TypeId>('adulto');
  const [side, setSide] = useState<'frente' | 'costas'>('frente');
  const [added, setAdded] = useState(false);

  const colorObj = COLORS.find((c) => c.id === color)!;
  const typeObj = TYPES.find((t) => t.id === type)!;
  const img = side === 'frente' ? colorObj.frontImg : colorObj.backImg;

  function handleAdd() {
    if (!size) return;
    add({
      color: color,
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
    <div className="v-card max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
      {/* Image */}
      <div className="relative aspect-square border-2 border-ink bg-bone overflow-hidden">
        <Image
          src={img}
          alt={`Camisa ${colorObj.label} (${side})`}
          fill
          sizes="(min-width: 768px) 480px, 90vw"
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

      {/* Controls */}
      <div className="flex flex-col gap-5">
        <div>
          <h3 className="font-display text-2xl tracking-wider uppercase">Escolha a Cor</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setColor(c.id)}
                className={`v-chip ${color === c.id ? 'v-chip-active' : ''}`}
              >
                <span
                  className="inline-block w-3 h-3 border border-ink mr-2"
                  style={{ background: c.swatch }}
                />
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-display text-2xl tracking-wider uppercase">Tipo</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={`v-chip ${type === t.id ? 'v-chip-active' : ''}`}
              >
                {t.label} — R$ {t.price.toFixed(2).replace('.', ',')}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-display text-2xl tracking-wider uppercase">Tamanho</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={`v-chip min-w-[3rem] ${size === s ? 'v-chip-active' : ''}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-2 border-t-2 border-ink">
          <p className="font-body text-sm mb-3">
            Reserva: <strong>50% do valor</strong> · Restante pago na retirada da camisa.
          </p>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!size}
            className="v-btn w-full"
          >
            {added ? '✓ Adicionado ao carrinho' : 'Reservar agora'}
          </button>
        </div>
      </div>
    </div>
  );
}
