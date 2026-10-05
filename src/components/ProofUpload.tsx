'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Props = {
  protocolo: string;
  phone: string;
  /** Chamado depois que o comprovante foi gravado na reserva. */
  onDone?: () => void;
  compact?: boolean;
};

const MAX_MB = 10;

/**
 * Anexa o comprovante a uma reserva que ja existe.
 * Serve tanto para quem foi pro WhatsApp e nao mandou nada quanto para quem
 * fechou a aba antes de enviar — por isso vive no checkout e em /meus-pedidos.
 */
export function ProofUpload({ protocolo, phone, onDone, compact = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function handleSend() {
    if (!file) {
      setError('Escolha o arquivo do comprovante.');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`O arquivo passa de ${MAX_MB} MB. Envie uma foto menor ou um PDF.`);
      return;
    }

    setError(null);
    setSending(true);
    try {
      const supabase = createClient();
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${protocolo}_${Date.now()}_${safe}`;

      const up = await supabase.storage.from('comprovantes').upload(path, file);
      if (up.error) throw up.error;

      const { data: pub } = supabase.storage.from('comprovantes').getPublicUrl(path);

      const { data, error: rpcErr } = await supabase.rpc('anexar_comprovante', {
        p_phone: phone,
        p_protocol: protocolo,
        p_url: pub.publicUrl
      });
      if (rpcErr) throw rpcErr;
      if (data !== true) {
        throw new Error(
          'Não encontramos uma reserva com esse protocolo e WhatsApp. Confira os dados.'
        );
      }

      setOk(true);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      onDone?.();
    } catch (err: any) {
      setError(err?.message ?? 'Não foi possível enviar o comprovante.');
    } finally {
      setSending(false);
    }
  }

  if (ok) {
    return (
      <p className="font-body text-sm text-ink border-l-2 border-success bg-success-soft px-4 py-3 rounded-r-xl">
        Comprovante enviado! A secretaria vai conferir e confirmar sua reserva.
      </p>
    );
  }

  return (
    <div className={compact ? '' : 'mt-1'}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={(e) => {
          setFile(e.target.files?.[0] ?? null);
          setError(null);
        }}
        className="v-input"
        aria-label="Arquivo do comprovante"
      />
      {file && (
        <p className="font-body text-xs mt-2 text-ash truncate">
          Selecionado: <strong className="text-ink">{file.name}</strong>
        </p>
      )}
      {error && (
        <p className="mt-2 font-body text-sm text-pink-dark border-l-2 border-pink bg-pink-soft px-4 py-2.5 rounded-r-xl">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleSend}
        disabled={sending || !file}
        className="v-btn v-btn-pink w-full mt-3"
      >
        {sending ? 'Enviando...' : 'Enviar comprovante'}
      </button>
    </div>
  );
}
