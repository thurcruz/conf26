export const ADULT_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XGG'] as const;
export const INFANT_SIZES = ['2', '4', '6', '8', '10', '12', '14'] as const;
export const SIZES = [...INFANT_SIZES, ...ADULT_SIZES] as const;
export type Size = typeof SIZES[number];

export const TYPES = [
  { id: 'infantil',  label: 'Infantil',  price: 40, sizes: INFANT_SIZES },
  { id: 'casual',    label: 'Casual',    price: 50, sizes: ADULT_SIZES },
  { id: 'oversize',  label: 'Oversize',  price: 60, sizes: ADULT_SIZES }
] as const;
export type TypeId = typeof TYPES[number]['id'];

export function sizesForType(typeId: string): readonly string[] {
  return TYPES.find((t) => t.id === typeId)?.sizes ?? ADULT_SIZES;
}

export const COLORS = [
  {
    id: 'branco-azul',
    label: 'Marfim / Azul',
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
  pixName: 'IGREJA BATISTA CENTRAL DE CAMPO-GRANDE',
  pixAddress: 'Rua União da Vitória, 564',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5521964829407'
} as const;
