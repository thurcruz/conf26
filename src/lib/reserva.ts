/** Linha devolvida pela funcao `consultar_reservas` do Postgres. */
export type ReservaConsulta = {
  protocolo: string;
  full_name: string;
  items: {
    colorLabel: string;
    size: string;
    typeLabel: string;
    qty: number;
    unit_price: number;
  }[];
  total_amount: number;
  reserve_amount: number;
  paid_in_full: boolean;
  tem_comprovante: boolean;
  whatsapp_sent: boolean;
  status: 'pendente' | 'confirmado' | 'cancelado';
  created_at: string;
};

export type StatusView = {
  label: string;
  hint: string;
  /** `acao` = falta algo do cliente; `ok` = confirmado; `neutro` = so aguardar. */
  tone: 'acao' | 'neutro' | 'ok' | 'cancelado';
};

/**
 * Traduz status + comprovante no que o cliente precisa entender:
 * sem comprovante a reserva nao anda, e isso tem que ficar obvio.
 */
export function statusView(r: Pick<ReservaConsulta, 'status' | 'tem_comprovante'>): StatusView {
  if (r.status === 'cancelado') {
    return {
      label: 'Reserva cancelada',
      hint: 'Fale com a secretaria se isso não estiver certo.',
      tone: 'cancelado'
    };
  }
  if (r.status === 'confirmado') {
    return {
      label: 'Reserva confirmada',
      hint: 'Tudo certo! É só retirar a camisa com a secretaria.',
      tone: 'ok'
    };
  }
  if (!r.tem_comprovante) {
    return {
      label: 'Falta o comprovante',
      hint: 'Sua camisa ainda não está garantida. Anexe o comprovante do PIX aqui embaixo.',
      tone: 'acao'
    };
  }
  return {
    label: 'Em análise',
    hint: 'Comprovante recebido. A secretaria vai conferir e confirmar sua reserva.',
    tone: 'neutro'
  };
}

export function brl(n: number) {
  return Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * O protocolo sao os 8 primeiros caracteres do uuid da reserva, em maiusculas.
 * E o mesmo numero em todo lugar: tela final do checkout, mensagem do WhatsApp,
 * consulta em /meus-pedidos e painel da secretaria.
 */
export function protocoloDe(id: string) {
  return id.slice(0, 8).toUpperCase();
}

// ------------------------------------------------------------
// Lembrete local do ultimo pedido, para pre-preencher a consulta.
// E so conveniencia: nada aqui autentica ninguem, a checagem real
// (telefone + protocolo) acontece no Postgres.
// ------------------------------------------------------------
const KEY = 'adp:ultima-reserva';

export type ReservaLembrada = { protocolo: string; phone: string };

export function lembrarReserva(r: ReservaLembrada) {
  try {
    localStorage.setItem(KEY, JSON.stringify(r));
  } catch {
    /* modo privado / storage bloqueado — segue sem lembrar */
  }
}

export function lerReservaLembrada(): ReservaLembrada | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (typeof v?.protocolo === 'string' && typeof v?.phone === 'string') return v;
    return null;
  } catch {
    return null;
  }
}
