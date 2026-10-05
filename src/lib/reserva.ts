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
      // Confirmado nao e "pode buscar": a retirada tem data propria, avisada
      // pela secretaria. O card explica isso logo abaixo, em "Quando retirar".
      hint: 'Pagamento conferido e sua camisa está garantida. Agora é só aguardar o aviso da retirada.',
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
// Sessao local dos pedidos feitos/consultados neste navegador.
// Guarda WhatsApp + protocolo de cada um para /meus-pedidos abrir sozinho,
// sem a pessoa digitar os dados de novo toda vez.
// E so conveniencia: nada aqui autentica ninguem, a checagem real
// (telefone + protocolo) acontece no Postgres.
// ------------------------------------------------------------
const KEY = 'adp:sessao-pedidos';
/** Chave antiga, de quando so cabia um pedido — migrada na primeira leitura. */
const KEY_ANTIGA = 'adp:ultima-reserva';
/** Teto generoso: familia inteira reservando do mesmo celular. */
const MAX = 12;

export type ReservaLembrada = { protocolo: string; phone: string };

function sanear(v: any): ReservaLembrada | null {
  if (typeof v?.protocolo !== 'string' || typeof v?.phone !== 'string') return null;
  const protocolo = v.protocolo.trim().replace(/^#/, '').toUpperCase();
  if (protocolo.length < 8) return null;
  return { protocolo, phone: v.phone };
}

/** Pedidos salvos neste aparelho, do mais recente para o mais antigo. */
export function lerReservasLembradas(): ReservaLembrada[] {
  if (typeof window === 'undefined') return [];

  const lista: ReservaLembrada[] = [];
  const juntar = (v: any) => {
    const r = sanear(v);
    if (r && !lista.some((x) => x.protocolo === r.protocolo)) lista.push(r);
  };

  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) arr.forEach(juntar);
    }
  } catch {
    /* json corrompido / storage bloqueado — segue sem lembrar */
  }
  try {
    const antigo = localStorage.getItem(KEY_ANTIGA);
    if (antigo) juntar(JSON.parse(antigo));
  } catch {
    /* idem */
  }

  return lista.slice(0, MAX);
}

function gravar(lista: ReservaLembrada[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lista.slice(0, MAX)));
    localStorage.removeItem(KEY_ANTIGA);
  } catch {
    /* modo privado / storage bloqueado — segue sem lembrar */
  }
}

/** Salva (ou atualiza) um pedido no topo da lista. */
export function lembrarReserva(r: ReservaLembrada) {
  const novo = sanear(r);
  if (!novo) return;
  gravar([novo, ...lerReservasLembradas().filter((x) => x.protocolo !== novo.protocolo)]);
}

export function esquecerReserva(protocolo: string) {
  const alvo = protocolo.trim().replace(/^#/, '').toUpperCase();
  gravar(lerReservasLembradas().filter((x) => x.protocolo !== alvo));
}

export function esquecerTodasReservas() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(KEY_ANTIGA);
  } catch {
    /* nada a fazer */
  }
}
