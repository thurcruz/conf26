'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

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
  notes: string | null;
  created_at: string;
};

function brl(n: number) {
  return Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
      .filter((r) => r.status === 'confirmado')
      .reduce((a, r) => a + Number(r.reserve_amount), 0);
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

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="bg-ink text-paper border-b-2 border-ink">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-display text-2xl tracking-widest uppercase">Painel Admin</h1>
            <p className="font-body text-xs opacity-80">{userEmail}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="v-btn v-btn-sm">Site</Link>
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
              <div className="flex items-center gap-2">
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
                <span className="font-body text-sm italic">
                  {r.whatsapp_sent ? 'Comprovante via WhatsApp' : 'Sem comprovante'}
                </span>
              )}
              <a
                href={`https://wa.me/${r.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="v-btn v-btn-sm"
              >
                WhatsApp
              </a>
              {r.status !== 'confirmado' && (
                <button
                  type="button"
                  onClick={() => changeStatus(r.id, 'confirmado')}
                  className="v-btn v-btn-sm v-btn-dark"
                >
                  Confirmar
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
