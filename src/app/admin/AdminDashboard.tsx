'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { COLORS, TYPES, sizesForType, type ColorId, type Size, type TypeId } from '@/lib/products';

type Item = {
  color: string;
  colorLabel: string;
  size: string;
  type: string;
  typeLabel: string;
  qty: number;
  unit_price: number;
};

type Reservation = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  items: Item[];
  total_amount: number;
  reserve_amount: number;
  payment_proof_url: string | null;
  whatsapp_sent: boolean;
  status: 'pendente' | 'confirmado' | 'cancelado';
  paid_in_full: boolean;
  notes: string | null;
  created_at: string;
};

function brl(n: number) {
  return Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function waNumber(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  // Se o cliente digitou so DDD+numero (10 ou 11 digitos), assume Brasil (+55)
  if (digits.length === 10 || digits.length === 11) digits = '55' + digits;
  return digits;
}

export function AdminDashboard({
  initialReservations,
  userEmail
}: {
  initialReservations: Reservation[];
  userEmail: string;
}) {
  const router = useRouter();
  const [list, setList] = useState<Reservation[]>(initialReservations);
  const [filter, setFilter] = useState<'todas' | 'pendente' | 'confirmado' | 'cancelado'>('todas');
  const [search, setSearch] = useState('');
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [editing, setEditing] = useState<Reservation | null>(null);
  const [creating, setCreating] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const filtered = useMemo(() => {
    return list.filter((r) => {
      if (filter !== 'todas' && r.status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.full_name.toLowerCase().includes(q) && !r.phone.includes(q)) return false;
      }
      return true;
    });
  }, [list, filter, search]);

  const stats = useMemo(() => {
    const totalItems = list.reduce(
      (acc, r) => acc + r.items.reduce((a, i) => a + i.qty, 0),
      0
    );
    const totalReservas = list.length;
    const totalArrecadado = list
      .filter((r) => r.status === 'confirmado' || r.paid_in_full)
      .reduce(
        (a, r) =>
          a + Number(r.paid_in_full ? r.total_amount : r.reserve_amount),
        0
      );
    const pendente = list.filter((r) => r.status === 'pendente').length;
    return { totalItems, totalReservas, totalArrecadado, pendente };
  }, [list]);

  async function changeStatus(id: string, status: Reservation['status']) {
    const supabase = createClient();
    const { error } = await supabase.from('reservations').update({ status }).eq('id', id);
    if (error) {
      alert('Erro: ' + error.message);
      return;
    }
    setList((cur) => cur.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  async function togglePaid(id: string, paid: boolean) {
    const supabase = createClient();
    const { error } = await supabase
      .from('reservations')
      .update({ paid_in_full: paid })
      .eq('id', id);
    if (error) {
      alert('Erro: ' + error.message);
      return;
    }
    setList((cur) =>
      cur.map((r) => (r.id === id ? { ...r, paid_in_full: paid } : r))
    );
  }

  async function attachProof(id: string, file: File) {
    const supabase = createClient();
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `admin_${id}_${Date.now()}_${safe}`;
    const up = await supabase.storage.from('comprovantes').upload(path, file);
    if (up.error) {
      alert('Erro no upload: ' + up.error.message);
      return;
    }
    const { data: pub } = supabase.storage
      .from('comprovantes')
      .getPublicUrl(path);
    const url = pub.publicUrl;
    const { error } = await supabase
      .from('reservations')
      .update({ payment_proof_url: url })
      .eq('id', id);
    if (error) {
      alert('Erro ao salvar URL: ' + error.message);
      return;
    }
    setList((cur) =>
      cur.map((r) => (r.id === id ? { ...r, payment_proof_url: url } : r))
    );
  }

  function downloadProof(r: Reservation) {
    if (!r.payment_proof_url) return;
    const url = r.payment_proof_url;
    const urlPath = new URL(url).pathname;
    const extMatch = urlPath.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1] : 'bin';
    const firstName = r.full_name.trim().split(/\s+/)[0].toLowerCase();
    const filename = `comprovante_${firstName}_${r.id.slice(0, 8)}.${ext}`;
    // Supabase Storage: ?download=<name> faz o servidor enviar
    // Content-Disposition: attachment, forcando download real em mobile.
    const sep = url.includes('?') ? '&' : '?';
    const downloadUrl = `${url}${sep}download=${encodeURIComponent(filename)}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function remove(id: string) {
    if (!confirm('Excluir esta reserva?')) return;
    const supabase = createClient();
    const { error } = await supabase.from('reservations').delete().eq('id', id);
    if (error) {
      alert('Erro: ' + error.message);
      return;
    }
    setList((cur) => cur.filter((r) => r.id !== id));
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  function exportPrint() {
    setShowReport(true);
  }

  function updateReservationInList(updated: Reservation) {
    setList((cur) => cur.map((r) => (r.id === updated.id ? updated : r)));
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="bg-ink text-paper border-b-2 border-ink">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-display text-2xl tracking-widest uppercase">Painel Admin</h1>
            <p className="font-body text-xs opacity-80">{userEmail}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/" className="v-btn v-btn-sm">Site</Link>
            <button type="button" onClick={exportPrint} className="v-btn v-btn-sm">
              Relatório
            </button>
            <button type="button" onClick={() => setShowChangePwd(true)} className="v-btn v-btn-sm">
              Trocar senha
            </button>
            <button type="button" onClick={logout} className="v-btn v-btn-sm">Sair</button>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Reservas" value={String(stats.totalReservas)} />
        <StatCard label="Camisas reservadas" value={String(stats.totalItems)} />
        <StatCard label="Pendentes" value={String(stats.pendente)} />
        <StatCard label="Arrecadado (confirmado)" value={brl(stats.totalArrecadado)} />
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-3 flex gap-3 flex-wrap">
        {(['todas', 'pendente', 'confirmado', 'cancelado'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`v-chip ${filter === f ? 'v-chip-active' : ''}`}
          >
            {f}
          </button>
        ))}
        <input
          placeholder="Buscar por nome ou telefone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="v-input flex-1 min-w-[200px]"
        />
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-3">
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="v-btn"
        >
          + Novo pedido
        </button>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-10 space-y-3">
        {filtered.length === 0 && (
          <div className="v-card text-center font-body">Nenhuma reserva encontrada.</div>
        )}
        {filtered.map((r) => (
          <article key={r.id} className="v-card">
            <header className="flex justify-between flex-wrap gap-2 border-b-2 border-ink pb-2 mb-2">
              <div>
                <h3 className="font-display text-xl tracking-wide uppercase leading-tight">
                  {r.full_name}
                </h3>
                <p className="font-body text-sm">
                  {r.phone} · {r.email ?? '—'} ·{' '}
                  {new Date(r.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`v-chip ${
                    r.status === 'confirmado'
                      ? 'v-chip-active'
                      : r.status === 'cancelado'
                      ? 'bg-bone'
                      : ''
                  }`}
                >
                  {r.status}
                </span>
                {r.paid_in_full && (
                  <span className="v-chip v-chip-active">pago 100%</span>
                )}
              </div>
            </header>

            <ul className="font-body text-sm space-y-1">
              {r.items.map((i, idx) => (
                <li key={idx}>
                  {i.qty}x Camisa {i.colorLabel} — {i.size} ({i.typeLabel}) — {brl(i.unit_price)}
                </li>
              ))}
            </ul>

            <div className="mt-2 font-display tracking-wide uppercase text-lg flex justify-between">
              <span>Total {brl(r.total_amount)}</span>
              <span>Reserva {brl(r.reserve_amount)}</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {r.payment_proof_url ? (
                <>
                  <a
                    href={r.payment_proof_url}
                    target="_blank"
                    rel="noreferrer"
                    className="v-btn v-btn-sm"
                  >
                    Ver comprovante
                  </a>
                  <button
                    type="button"
                    onClick={() => downloadProof(r)}
                    className="v-btn v-btn-sm"
                  >
                    Baixar
                  </button>
                </>
              ) : (
                <span className="font-body text-sm italic self-center">
                  {r.whatsapp_sent ? 'Comprovante via WhatsApp' : 'Sem comprovante'}
                </span>
              )}
              <label className="v-btn v-btn-sm cursor-pointer">
                {r.payment_proof_url ? 'Trocar anexo' : 'Anexar comprovante'}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) attachProof(r.id, f);
                    e.target.value = '';
                  }}
                />
              </label>
              <a
                href={`https://wa.me/${waNumber(r.phone)}?text=${encodeURIComponent(
                  `Olá, ${r.full_name.split(' ')[0]}! Aqui é da Secretária da IBCCG.\n\n` +
                    `Estamos organizando as reservas das camisas da Conferência 2026 e ainda não recebemos o comprovante do PIX da sua reserva #${r.id.slice(0, 8).toUpperCase()} (${brl(r.reserve_amount)}).\n\n` +
                    `Você poderia nos enviar o comprovante por aqui, por favor? Assim garantimos sua camisa. Muito obrigado!`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="v-btn v-btn-sm"
              >
                Cobrar no WhatsApp
              </a>
              <button
                type="button"
                onClick={() => setEditing(r)}
                className="v-btn v-btn-sm"
              >
                Editar
              </button>
              {r.status !== 'confirmado' && (
                <button
                  type="button"
                  onClick={() => changeStatus(r.id, 'confirmado')}
                  className="v-btn v-btn-sm"
                >
                  Confirmar reserva
                </button>
              )}
              {!r.paid_in_full ? (
                <button
                  type="button"
                  onClick={() => togglePaid(r.id, true)}
                  className="v-btn v-btn-sm"
                >
                  Total pago
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => togglePaid(r.id, false)}
                  className="v-btn v-btn-sm"
                >
                  Desfazer total pago
                </button>
              )}
              {r.status !== 'pendente' && (
                <button
                  type="button"
                  onClick={() => changeStatus(r.id, 'pendente')}
                  className="v-btn v-btn-sm"
                >
                  Pendente
                </button>
              )}
              {r.status !== 'cancelado' && (
                <button
                  type="button"
                  onClick={() => changeStatus(r.id, 'cancelado')}
                  className="v-btn v-btn-sm"
                >
                  Cancelar
                </button>
              )}
              <button type="button" onClick={() => remove(r.id)} className="v-btn v-btn-sm">
                Excluir
              </button>
            </div>
          </article>
        ))}
      </section>

      {showChangePwd && (
        <ChangePasswordModal onClose={() => setShowChangePwd(false)} />
      )}

      {editing && (
        <EditReservationModal
          reservation={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            updateReservationInList(updated);
            setEditing(null);
          }}
        />
      )}

      {creating && (
        <NewReservationModal
          onClose={() => setCreating(false)}
          onCreated={(r) => {
            setList((cur) => [r, ...cur]);
            setCreating(false);
          }}
        />
      )}

      {showReport && (
        <ReportOverlay
          rows={[...filtered].sort((a, b) =>
            a.full_name.localeCompare(b.full_name, 'pt-BR')
          )}
          filter={filter}
          onClose={() => setShowReport(false)}
        />
      )}
    </main>
  );
}

function ReportOverlay({
  rows,
  filter,
  onClose
}: {
  rows: Reservation[];
  filter: string;
  onClose: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const html = buildPrintHtml(rows, filter);

  function print() {
    const w = iframeRef.current?.contentWindow;
    if (!w) return;
    try {
      w.focus();
      w.print();
    } catch {
      alert('Não foi possível iniciar a impressão.');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/80 flex flex-col p-3"
      role="dialog"
      aria-modal="true"
      aria-label="Relatório de reservas"
    >
      <div className="flex justify-between items-center gap-2 mb-2 flex-wrap">
        <h2 className="font-display text-2xl tracking-widest uppercase text-paper drop-shadow-[2px_2px_0_rgba(0,0,0,0.85)]">
          Relatório de reservas
        </h2>
        <div className="flex gap-2">
          <button type="button" onClick={print} className="v-btn v-btn-sm">
            Imprimir / Salvar PDF
          </button>
          <button type="button" onClick={onClose} className="v-btn v-btn-sm">
            Fechar
          </button>
        </div>
      </div>
      <iframe
        ref={iframeRef}
        title="Relatório de reservas"
        srcDoc={html}
        className="flex-1 w-full bg-white border-2 border-ink"
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="v-card">
      <p className="font-body text-xs tracking-widest uppercase">{label}</p>
      <p className="font-display text-3xl tracking-wider mt-1">{value}</p>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildPrintHtml(rows: Reservation[], filter: string): string {
  const now = new Date().toLocaleString('pt-BR');
  const totalCamisas = rows.reduce(
    (a, r) => a + r.items.reduce((b, i) => b + i.qty, 0),
    0
  );
  const totalPendente = rows.reduce(
    (a, r) => a + (r.paid_in_full ? 0 : Number(r.total_amount) - Number(r.reserve_amount)),
    0
  );

  const trs = rows
    .map((r) => {
      const itemsHtml = r.items
        .map(
          (i) =>
            `${i.qty}× ${escapeHtml(i.colorLabel)} <b>${escapeHtml(i.size)}</b> (${escapeHtml(i.typeLabel)})`
        )
        .join('<br>');
      const restante = r.paid_in_full
        ? '—'
        : `R$ ${(Number(r.total_amount) - Number(r.reserve_amount)).toFixed(2).replace('.', ',')}`;
      return `
        <tr>
          <td class="chk"></td>
          <td>${escapeHtml(r.full_name)}</td>
          <td class="phone">${escapeHtml(r.phone)}</td>
          <td>${itemsHtml}</td>
          <td class="num">R$ ${Number(r.total_amount).toFixed(2).replace('.', ',')}</td>
          <td class="num">R$ ${Number(r.reserve_amount).toFixed(2).replace('.', ',')}</td>
          <td class="num">${restante}</td>
          <td class="status">${r.paid_in_full ? 'PAGO 100%' : escapeHtml(r.status)}</td>
          <td class="sig"></td>
        </tr>
      `;
    })
    .join('');

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Relatório de reservas — Conferência 2026</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: 'Courier New', monospace;
    color: #0a0a0a;
    margin: 24px;
  }
  h1 { font-family: Impact, sans-serif; letter-spacing: 2px; margin: 0 0 4px; }
  .meta { font-size: 12px; margin-bottom: 12px; display: flex; gap: 20px; flex-wrap: wrap; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #0a0a0a; padding: 6px 8px; vertical-align: top; }
  thead th {
    background: #0a0a0a; color: #f5f1e8;
    font-family: Impact, sans-serif; letter-spacing: 1px;
    font-weight: normal; text-align: left;
  }
  tbody tr:nth-child(even) { background: #f5f1e8; }
  .chk { width: 26px; text-align: center; }
  .chk::before {
    content: ''; display: inline-block; width: 14px; height: 14px;
    border: 2px solid #0a0a0a;
  }
  .num, .phone, .status { white-space: nowrap; }
  .num { text-align: right; }
  .sig { min-width: 100px; }
  .footer { margin-top: 12px; font-size: 11px; opacity: 0.8; }
  .btns { margin-bottom: 12px; }
  .btns button {
    font-family: Impact, sans-serif; letter-spacing: 1px;
    background: #0a0a0a; color: #f5f1e8;
    padding: 6px 14px; border: none; cursor: pointer;
  }
  @media print {
    body { margin: 12mm; }
    .btns { display: none; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
  }
</style>
</head>
<body>
  <h1>Conferência 2026 — Entrega de Camisas</h1>
  <div class="meta">
    <span><b>Gerado em:</b> ${escapeHtml(now)}</span>
    <span><b>Filtro:</b> ${escapeHtml(filter)}</span>
    <span><b>Total de reservas:</b> ${rows.length}</span>
    <span><b>Total de camisas:</b> ${totalCamisas}</span>
    <span><b>A receber na retirada:</b> R$ ${totalPendente.toFixed(2).replace('.', ',')}</span>
  </div>
  <table>
    <thead>
      <tr>
        <th class="chk">✓</th>
        <th>Nome</th>
        <th>Telefone</th>
        <th>Itens</th>
        <th class="num">Total</th>
        <th class="num">Pago</th>
        <th class="num">Restante</th>
        <th>Status</th>
        <th>Assinatura</th>
      </tr>
    </thead>
    <tbody>
      ${trs || '<tr><td colspan="9" style="text-align:center;padding:16px">Sem reservas neste filtro.</td></tr>'}
    </tbody>
  </table>
  <p class="footer">Marque o ✓ ao entregar a camisa. Peça a assinatura do responsável ao lado.</p>
</body>
</html>`;
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (pwd.length < 6) {
      setMsg({ kind: 'err', text: 'A senha precisa ter pelo menos 6 caracteres.' });
      return;
    }
    if (pwd !== pwd2) {
      setMsg({ kind: 'err', text: 'As senhas não coincidem.' });
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setSaving(false);
    if (error) {
      setMsg({ kind: 'err', text: error.message });
      return;
    }
    setMsg({ kind: 'ok', text: 'Senha alterada com sucesso.' });
    setPwd('');
    setPwd2('');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60"
      role="dialog"
      aria-modal="true"
    >
      <form onSubmit={save} className="v-card w-full max-w-md">
        <header className="flex justify-between items-center border-b-2 border-ink pb-2 mb-3">
          <h2 className="font-display text-2xl tracking-widest uppercase">Trocar senha</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="v-btn v-btn-sm !p-1 !px-2 leading-none"
          >
            ×
          </button>
        </header>

        <label className="block">
          <span className="font-display tracking-widest uppercase text-sm">Nova senha</span>
          <input
            type="password"
            required
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            className="v-input mt-1"
            autoFocus
          />
        </label>
        <label className="block mt-3">
          <span className="font-display tracking-widest uppercase text-sm">Confirmar nova senha</span>
          <input
            type="password"
            required
            value={pwd2}
            onChange={(e) => setPwd2(e.target.value)}
            className="v-input mt-1"
          />
        </label>

        {msg && (
          <div
            className={`mt-3 border-2 border-ink p-2 font-body text-sm ${
              msg.kind === 'ok' ? 'bg-bone' : 'bg-white'
            }`}
          >
            {msg.kind === 'ok' ? '✓' : '⚠'} {msg.text}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mt-5">
          <button type="button" onClick={onClose} className="v-btn v-btn-sm">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="v-btn v-btn-sm">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}

function EditReservationModal({
  reservation,
  onClose,
  onSaved
}: {
  reservation: Reservation;
  onClose: () => void;
  onSaved: (r: Reservation) => void;
}) {
  const [name, setName] = useState(reservation.full_name);
  const [phone, setPhone] = useState(reservation.phone);
  const [email, setEmail] = useState(reservation.email ?? '');
  const [notes, setNotes] = useState(reservation.notes ?? '');
  const [items, setItems] = useState<Item[]>(reservation.items.map((i) => ({ ...i })));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalAmount = items.reduce((a, i) => a + i.unit_price * i.qty, 0);
  const reserveAmount = totalAmount / 2;

  function updateItem(idx: number, patch: Partial<Item>) {
    setItems((cur) =>
      cur.map((it, i) => {
        if (i !== idx) return it;
        const merged = { ...it, ...patch };
        // Se mudou o tipo, atualiza o unit_price, typeLabel e reseta o size
        // se ele nao existir mais no novo tipo
        if (patch.type) {
          const t = TYPES.find((x) => x.id === patch.type);
          if (t) {
            merged.unit_price = t.price;
            merged.typeLabel = t.label;
            const allowed = sizesForType(patch.type);
            if (!allowed.includes(merged.size)) {
              merged.size = allowed[0];
            }
          }
        }
        // Se mudou a cor, atualiza colorLabel
        if (patch.color) {
          const c = COLORS.find((x) => x.id === patch.color);
          if (c) merged.colorLabel = c.label;
        }
        return merged;
      })
    );
  }

  function removeItem(idx: number) {
    setItems((cur) => cur.filter((_, i) => i !== idx));
  }

  function addItem() {
    const c = COLORS[0];
    const t = TYPES[0];
    setItems((cur) => [
      ...cur,
      {
        color: c.id,
        colorLabel: c.label,
        size: t.sizes[0],
        type: t.id,
        typeLabel: t.label,
        qty: 1,
        unit_price: t.price
      }
    ]);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !phone.trim()) {
      setError('Nome e telefone são obrigatórios.');
      return;
    }
    if (items.length === 0) {
      setError('A reserva precisa ter pelo menos um item.');
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const patch = {
      full_name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
      notes: notes.trim() || null,
      items,
      total_amount: totalAmount,
      reserve_amount: reserveAmount
    };
    const { error: updErr } = await supabase
      .from('reservations')
      .update(patch)
      .eq('id', reservation.id);
    setSaving(false);
    if (updErr) {
      setError(updErr.message);
      return;
    }
    onSaved({ ...reservation, ...patch });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <form onSubmit={save} className="v-card w-full max-w-2xl my-8">
        <header className="flex justify-between items-center border-b-2 border-ink pb-2 mb-3">
          <h2 className="font-display text-2xl tracking-widest uppercase">
            Editar reserva #{reservation.id.slice(0, 8).toUpperCase()}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="v-btn v-btn-sm !p-1 !px-2 leading-none"
          >
            ×
          </button>
        </header>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block sm:col-span-2">
            <span className="font-display tracking-widest uppercase text-sm">Nome completo *</span>
            <input
              className="v-input mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="font-display tracking-widest uppercase text-sm">Telefone *</span>
            <input
              className="v-input mt-1"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="font-display tracking-widest uppercase text-sm">
              E-mail <span className="opacity-70">(opcional)</span>
            </span>
            <input
              className="v-input mt-1"
              type="text"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="font-display tracking-widest uppercase text-sm">Observações</span>
            <textarea
              className="v-input mt-1"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </div>

        <h3 className="font-display text-xl tracking-widest uppercase border-b-2 border-ink pb-1 mt-5 mb-2">
          Itens
        </h3>

        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="border-2 border-ink p-3 grid gap-2 sm:grid-cols-[1fr_1fr_5rem_5rem_2.5rem]">
              <select
                value={it.color}
                onChange={(e) => updateItem(idx, { color: e.target.value as ColorId })}
                className="v-input"
              >
                {COLORS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              <select
                value={it.type}
                onChange={(e) => updateItem(idx, { type: e.target.value as TypeId })}
                className="v-input"
              >
                {TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label} ({brl(t.price)})
                  </option>
                ))}
              </select>
              <select
                value={it.size}
                onChange={(e) => updateItem(idx, { size: e.target.value as Size })}
                className="v-input"
              >
                {sizesForType(it.type).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={it.qty}
                onChange={(e) => updateItem(idx, { qty: Math.max(1, Number(e.target.value) || 1) })}
                className="v-input"
              />
              <button
                type="button"
                onClick={() => removeItem(idx)}
                aria-label="Remover item"
                className="v-btn v-btn-sm !p-1"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <button type="button" onClick={addItem} className="v-btn v-btn-sm mt-3">
          + Adicionar item
        </button>

        <div className="mt-4 pt-3 border-t-2 border-ink flex justify-between font-display text-xl uppercase">
          <span>Total: {brl(totalAmount)}</span>
          <span>Reserva 50%: {brl(reserveAmount)}</span>
        </div>

        {error && (
          <div className="mt-3 border-2 border-ink bg-white p-2 font-body text-sm">
            ⚠ {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mt-5">
          <button type="button" onClick={onClose} className="v-btn v-btn-sm">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="v-btn v-btn-sm">
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}

function NewReservationModal({
  onClose,
  onCreated
}: {
  onClose: () => void;
  onCreated: (r: Reservation) => void;
}) {
  const firstColor = COLORS[0];
  const firstType = TYPES[0];
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Reservation['status']>('confirmado');
  const [payMode, setPayMode] = useState<'reserve' | 'full'>('reserve');
  const [items, setItems] = useState<Item[]>([
    {
      color: firstColor.id,
      colorLabel: firstColor.label,
      size: firstType.sizes[0],
      type: firstType.id,
      typeLabel: firstType.label,
      qty: 1,
      unit_price: firstType.price
    }
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalAmount = items.reduce((a, i) => a + i.unit_price * i.qty, 0);
  const reserveAmount = payMode === 'full' ? totalAmount : totalAmount / 2;

  function updateItem(idx: number, patch: Partial<Item>) {
    setItems((cur) =>
      cur.map((it, i) => {
        if (i !== idx) return it;
        const merged = { ...it, ...patch };
        if (patch.type) {
          const t = TYPES.find((x) => x.id === patch.type);
          if (t) {
            merged.unit_price = t.price;
            merged.typeLabel = t.label;
            const allowed = sizesForType(patch.type);
            if (!allowed.includes(merged.size)) merged.size = allowed[0];
          }
        }
        if (patch.color) {
          const c = COLORS.find((x) => x.id === patch.color);
          if (c) merged.colorLabel = c.label;
        }
        return merged;
      })
    );
  }
  function removeItem(idx: number) {
    setItems((cur) => cur.filter((_, i) => i !== idx));
  }
  function addItem() {
    const c = COLORS[0];
    const t = TYPES[0];
    setItems((cur) => [
      ...cur,
      {
        color: c.id,
        colorLabel: c.label,
        size: t.sizes[0],
        type: t.id,
        typeLabel: t.label,
        qty: 1,
        unit_price: t.price
      }
    ]);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !phone.trim()) {
      setError('Nome e telefone são obrigatórios.');
      return;
    }
    if (items.length === 0) {
      setError('A reserva precisa ter pelo menos um item.');
      return;
    }
    setSaving(true);
    const id = crypto.randomUUID();
    const supabase = createClient();
    const paidInFull = payMode === 'full';
    const now = new Date().toISOString();
    const row: Reservation = {
      id,
      full_name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
      items,
      total_amount: totalAmount,
      reserve_amount: reserveAmount,
      payment_proof_url: null,
      whatsapp_sent: false,
      status,
      paid_in_full: paidInFull,
      notes: notes.trim() || null,
      created_at: now
    };
    const { error: insErr } = await supabase.from('reservations').insert({
      id,
      full_name: row.full_name,
      phone: row.phone,
      email: row.email,
      items: row.items,
      total_amount: row.total_amount,
      reserve_amount: row.reserve_amount,
      status: row.status,
      paid_in_full: row.paid_in_full,
      notes: row.notes,
      whatsapp_sent: false,
      payment_proof_url: null
    });
    setSaving(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    onCreated(row);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <form onSubmit={save} className="v-card w-full max-w-2xl my-8">
        <header className="flex justify-between items-center border-b-2 border-ink pb-2 mb-3">
          <h2 className="font-display text-2xl tracking-widest uppercase">Novo pedido</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="v-btn v-btn-sm !p-1 !px-2 leading-none"
          >
            ×
          </button>
        </header>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block sm:col-span-2">
            <span className="font-display tracking-widest uppercase text-sm">Nome completo *</span>
            <input
              className="v-input mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </label>
          <label className="block">
            <span className="font-display tracking-widest uppercase text-sm">Telefone *</span>
            <input
              className="v-input mt-1"
              placeholder="(21) 9 0000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="font-display tracking-widest uppercase text-sm">
              E-mail <span className="opacity-70">(opcional)</span>
            </span>
            <input
              className="v-input mt-1"
              type="text"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="font-display tracking-widest uppercase text-sm">Observações</span>
            <textarea
              className="v-input mt-1"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </div>

        <h3 className="font-display text-xl tracking-widest uppercase border-b-2 border-ink pb-1 mt-5 mb-2">
          Itens
        </h3>

        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="border-2 border-ink p-3 grid gap-2 sm:grid-cols-[1fr_1fr_5rem_5rem_2.5rem]">
              <select
                value={it.color}
                onChange={(e) => updateItem(idx, { color: e.target.value as ColorId })}
                className="v-input"
              >
                {COLORS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              <select
                value={it.type}
                onChange={(e) => updateItem(idx, { type: e.target.value as TypeId })}
                className="v-input"
              >
                {TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label} ({brl(t.price)})
                  </option>
                ))}
              </select>
              <select
                value={it.size}
                onChange={(e) => updateItem(idx, { size: e.target.value as Size })}
                className="v-input"
              >
                {sizesForType(it.type).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={it.qty}
                onChange={(e) => updateItem(idx, { qty: Math.max(1, Number(e.target.value) || 1) })}
                className="v-input"
              />
              <button
                type="button"
                onClick={() => removeItem(idx)}
                aria-label="Remover item"
                className="v-btn v-btn-sm !p-1"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <button type="button" onClick={addItem} className="v-btn v-btn-sm mt-3">
          + Adicionar item
        </button>

        <h3 className="font-display text-xl tracking-widest uppercase border-b-2 border-ink pb-1 mt-5 mb-2">
          Pagamento
        </h3>
        <div className="grid sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPayMode('reserve')}
            className={`v-chip w-full justify-between !py-3 ${
              payMode === 'reserve' ? 'v-chip-active' : ''
            }`}
          >
            <span>Reserva 50%</span>
            <strong>{brl(totalAmount / 2)}</strong>
          </button>
          <button
            type="button"
            onClick={() => setPayMode('full')}
            className={`v-chip w-full justify-between !py-3 ${
              payMode === 'full' ? 'v-chip-active' : ''
            }`}
          >
            <span>Pagou tudo</span>
            <strong>{brl(totalAmount)}</strong>
          </button>
        </div>

        <h3 className="font-display text-xl tracking-widest uppercase border-b-2 border-ink pb-1 mt-5 mb-2">
          Status inicial
        </h3>
        <div className="flex flex-wrap gap-2">
          {(['pendente', 'confirmado'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`v-chip ${status === s ? 'v-chip-active' : ''}`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t-2 border-ink flex justify-between font-display text-xl uppercase">
          <span>Total: {brl(totalAmount)}</span>
          <span>{payMode === 'full' ? 'Pago' : 'Reserva 50%'}: {brl(reserveAmount)}</span>
        </div>

        {error && (
          <div className="mt-3 border-2 border-ink bg-white p-2 font-body text-sm">
            ⚠ {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mt-5">
          <button type="button" onClick={onClose} className="v-btn v-btn-sm">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="v-btn v-btn-sm">
            {saving ? 'Salvando...' : 'Criar pedido'}
          </button>
        </div>
      </form>
    </div>
  );
}
