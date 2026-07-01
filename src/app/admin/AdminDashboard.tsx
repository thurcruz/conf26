'use client';

import { useMemo, useState } from 'react';
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
                <a
                  href={r.payment_proof_url}
                  target="_blank"
                  rel="noreferrer"
                  className="v-btn v-btn-sm"
                >
                  Ver comprovante
                </a>
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
                  Confirmar
                </button>
              )}
              {!r.paid_in_full ? (
                <button
                  type="button"
                  onClick={() => togglePaid(r.id, true)}
                  className="v-btn v-btn-sm"
                >
                  Pago
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => togglePaid(r.id, false)}
                  className="v-btn v-btn-sm"
                >
                  Desfazer pago
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
    </main>
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
            <span className="font-display tracking-widest uppercase text-sm">E-mail</span>
            <input
              className="v-input mt-1"
              type="email"
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
