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

/**
 * Camisas do "Alem do Palco".
 * `swatch` foi amostrado do pixel do tecido no proprio mockup, por isso
 * bate com a foto. Trocar arte = trocar o arquivo e reamostrar a cor.
 */
export const COLORS = [
  {
    id: 'marfim',
    label: 'Marfim',
    swatch: '#dee3bf',
    frontImg: '/camisas/CAMISAS_CONF26_ADP_MOCKUP_MARF_FRENTE.png',
    backImg: '/camisas/CAMISAS_CONF26_ADP_MOCKUP_MARF_COSTAS.png'
  },
  {
    id: 'azul-marinho',
    label: 'Azul Marinho',
    swatch: '#0f1326',
    frontImg: '/camisas/CAMISAS_CONF26_ADP_MOCKUP_AZM_FRENTE.png',
    backImg: '/camisas/CAMISAS_CONF26_ADP_MOCKUP_AZM_COSTAS.png'
  }
] as const;
export type ColorId = typeof COLORS[number]['id'];

/** Variantes do logotipo. Proporcao do lettering: 747 x 106 (~7:1). */
export const LOGOS = {
  navy: '/ADP_LOGOTIPOAZ-MARINHO.png',
  pink: '/ADP_LOGOTIPOVERMELHO-PINK.png',
  black: '/ADP_LOGOTIPOPRETO.png',
  white: '/ADP_LOGOTIPOBRANCO.png',
  favicon: '/ADP_FAVICON.png'
} as const;

/** Isotipo do Ministerio Recarga (branco). Proporcao: 721 x 645 (~1.12:1). */
export const RECARGA_LOGO = '/recarga-branco.png';

/**
 * Capa exibida na previa do link (WhatsApp, Instagram, etc).
 * Versao leve (1200x675, ~160KB) de /ADP_CAPA.png — previas do WhatsApp
 * costumam ser ignoradas acima de ~300KB.
 */
export const LINK_COVER = { url: '/capa-link.jpg', width: 1200, height: 675 } as const;

/** Cores da identidade — espelham os tokens do tailwind.config.ts. */
export const BRAND = {
  navy: '#090424',
  pink: '#ff0040'
} as const;

/** Foto da hero (alguem adorando). Cobre toda a altura na metade direita. */
export const WORSHIP_IMAGE = '/adoracao.png';

export const EVENT = {
  name: 'ALÉM DO PALCO',
  tagline: 'Conferência de Jovens',
  ministry: 'Ministério Recarga',
  /** Primeiro dia do evento — alimenta o countdown. */
  date: '2026-11-06T19:30:00-03:00',
  dateLabel: '6, 7 e 8 de novembro de 2026',
  dateShort: '6·7·8 nov',
  year: 2026,
  venue: 'Igreja Batista Central de Campo Grande',
  venueAddress: 'Rua União da Vitória, 564',
  pixKey: process.env.NEXT_PUBLIC_PIX_KEY ?? '42.252.288/0001-31',
  pixName: 'IGREJA BATISTA CENTRAL DE CAMPO-GRANDE',
  pixAddress: 'Rua União da Vitória, 564',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5521964829407'
} as const;

/** Conferencia anterior — arquivada em /ate-o-fim. */
export const PAST_EVENT = {
  name: 'ATÉ O FIM',
  tagline: 'Conferência 2026 · Adolescentes',
  verse: '“…o que perseverar até o fim, esse será salvo.”',
  verseRef: 'Mateus 24:13',
  dateLabel: '31 de julho de 2026',
  logo: '/historico/logo-ate-o-fim.png',
  cover: '/historico/fundo-ate-o-fim.png'
} as const;
