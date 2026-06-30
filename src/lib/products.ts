export const SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XGG'] as const;
export type Size = typeof SIZES[number];

export const TYPES = [
  { id: 'adulto', label: 'Adulto', price: 50 },
  { id: 'infantil', label: 'Infantil', price: 40 }
] as const;
export type TypeId = typeof TYPES[number]['id'];

export const COLORS = [
  {
    id: 'branco-azul',
    label: 'Branco / Azul',
    swatch: '#f5f1e8',
    frontImg: '/CAMISA_BRANCO_FRENTE.png',
    backImg: '/CAMISA_BRANCO_COSTAS.png'
  },
  {
    id: 'preto-roxo',
    label: 'Preto / Roxo',
    swatch: '#1a1a1a',
    frontImg: '/CAMISA_PRETO_FRENTE.png',
    backImg: '/CAMISA_PRETO_COSTAS.png'
  }
] as const;
export type ColorId = typeof COLORS[number]['id'];

export const EVENT = {
  name: 'CONFERÊNCIA 2026 — ATÉ O FIM',
  ministry: 'Ministério Recarga',
  date: '2026-07-31T20:00:00-03:00',
  pixKey: process.env.NEXT_PUBLIC_PIX_KEY ?? '42.252.288/0001-31',
  pixName:
    process.env.NEXT_PUBLIC_PIX_NAME ?? 'IGREJA BATISTA CENTRAL DE CAMPO-GRANDE',
  pixAddress:
    process.env.NEXT_PUBLIC_PIX_ADDRESS ?? 'Rua União da Vitória, 564',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5521964829407'
} as const;

export const SIZE_CHART = [
  { size: 'PP', chest: 48, length: 66 },
  { size: 'P', chest: 50, length: 68 },
  { size: 'M', chest: 52, length: 70 },
  { size: 'G', chest: 54, length: 72 },
  { size: 'GG', chest: 56, length: 74 },
  { size: 'XG', chest: 58, length: 76 },
  { size: 'XGG', chest: 60, length: 78 }
] as const;
