-- ============================================================
-- Consulta publica de reserva ("Meus pedidos") + anexo tardio do comprovante
--
-- A tabela `reservations` continua fechada para o anon (RLS nao da SELECT).
-- O acesso do cliente passa por duas funcoes SECURITY DEFINER que so devolvem
-- / alteram a linha quando WhatsApp **e** protocolo batem.
-- ============================================================

-- Normaliza telefone para so digitos, para comparar (21) 9 9999-9999 com 21999999999
create or replace function public.so_digitos(t text)
returns text
language sql
immutable
set search_path = public
as $$
  select regexp_replace(coalesce(t, ''), '\D', '', 'g');
$$;

-- ------------------------------------------------------------
-- 1. Consultar reservas (telefone + protocolo)
--    Nao devolve o uuid nem a url do comprovante — so o que o cliente precisa ver.
-- ------------------------------------------------------------
create or replace function public.consultar_reservas(p_phone text, p_protocol text)
returns table (
  protocolo       text,
  full_name       text,
  items           jsonb,
  total_amount    numeric,
  reserve_amount  numeric,
  paid_in_full    boolean,
  tem_comprovante boolean,
  whatsapp_sent   boolean,
  status          text,
  created_at      timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    upper(left(r.id::text, 8)),
    r.full_name,
    r.items,
    r.total_amount,
    r.reserve_amount,
    r.paid_in_full,
    (r.payment_proof_url is not null and length(r.payment_proof_url) > 0),
    r.whatsapp_sent,
    r.status,
    r.created_at
  from public.reservations r
  where length(public.so_digitos(p_phone)) >= 8
    and length(trim(coalesce(p_protocol, ''))) >= 8
    and right(public.so_digitos(r.phone), 8) = right(public.so_digitos(p_phone), 8)
    and upper(left(r.id::text, 8)) = upper(left(trim(p_protocol), 8))
  order by r.created_at desc;
$$;

-- ------------------------------------------------------------
-- 2. Anexar o comprovante depois (quem fechou a aba ou foi pro WhatsApp e nao enviou)
--    So mexe em `payment_proof_url`; nao deixa alterar status, valores nem itens.
-- ------------------------------------------------------------
create or replace function public.anexar_comprovante(
  p_phone    text,
  p_protocol text,
  p_url      text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if coalesce(trim(p_url), '') = '' then
    raise exception 'URL do comprovante vazia';
  end if;

  -- aceita apenas arquivos do bucket publico de comprovantes
  if p_url not like '%/storage/v1/object/public/comprovantes/%' then
    raise exception 'URL de comprovante invalida';
  end if;

  update public.reservations r
     set payment_proof_url = p_url
   where length(public.so_digitos(p_phone)) >= 8
     and length(trim(coalesce(p_protocol, ''))) >= 8
     and right(public.so_digitos(r.phone), 8) = right(public.so_digitos(p_phone), 8)
     and upper(left(r.id::text, 8)) = upper(left(trim(p_protocol), 8))
     and r.status <> 'cancelado';

  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

-- ------------------------------------------------------------
-- 3. Permissoes — so estas duas funcoes ficam expostas ao anon
-- ------------------------------------------------------------
revoke all on function public.consultar_reservas(text, text) from public;
revoke all on function public.anexar_comprovante(text, text, text) from public;

grant execute on function public.consultar_reservas(text, text) to anon, authenticated;
grant execute on function public.anexar_comprovante(text, text, text) to anon, authenticated;
