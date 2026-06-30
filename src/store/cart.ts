'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ColorId, Size, TypeId } from '@/lib/products';

export type CartItem = {
  id: string;          // `${color}-${size}-${type}`
  color: ColorId;
  colorLabel: string;
  size: Size;
  type: TypeId;
  typeLabel: string;
  unitPrice: number;
  qty: number;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, 'id' | 'qty'>, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  total: () => number;
  reserve: () => number;
  count: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, qty = 1) => {
        const id = `${item.color}-${item.size}-${item.type}`;
        set((s) => {
          const existing = s.items.find((i) => i.id === id);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.id === id ? { ...i, qty: i.qty + qty } : i
              )
            };
          }
          return { items: [...s.items, { ...item, id, qty }] };
        });
      },
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      setQty: (id, qty) =>
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => i.id !== id)
              : s.items.map((i) => (i.id === id ? { ...i, qty } : i))
        })),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((acc, i) => acc + i.unitPrice * i.qty, 0),
      reserve: () => get().total() / 2,
      count: () => get().items.reduce((acc, i) => acc + i.qty, 0)
    }),
    { name: 'conf26-cart' }
  )
);
