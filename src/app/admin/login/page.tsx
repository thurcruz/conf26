'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/admin');
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-paper text-ink flex items-center justify-center p-6">
      <form onSubmit={handleLogin} className="v-card w-full max-w-md">
        <h1 className="font-display text-3xl tracking-widest uppercase border-b-2 border-ink pb-3">
          Acesso · Líderes
        </h1>
        <p className="font-body text-sm mt-2">Ministério Recarga · Painel Administrativo</p>

        <label className="block mt-4">
          <span className="font-display tracking-widest uppercase text-sm">E-mail</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="v-input mt-1"
          />
        </label>
        <label className="block mt-3">
          <span className="font-display tracking-widest uppercase text-sm">Senha</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="v-input mt-1"
          />
        </label>

        {error && (
          <div className="mt-3 border-2 border-ink bg-bone p-2 font-body text-sm">⚠ {error}</div>
        )}

        <button type="submit" disabled={loading} className="v-btn w-full mt-5">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <Link href="/" className="block text-center font-body text-sm underline mt-3">
          Voltar ao site
        </Link>
      </form>
    </main>
  );
}
