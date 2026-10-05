-- ============================================================
--  ALEM DO PALCO — setup completo do banco
--  GERADO automaticamente a partir de supabase/migrations/*.sql
--  Nao edite este arquivo: edite as migrations e gere de novo.
--
--  Como usar: Supabase > SQL Editor > New query > cole tudo > Run
-- ============================================================


-- ============================================================
-- 0001_init.sql
-- ============================================================
-- ============================================================
-- Conf26 "Até o Fim" — Ministério Recarga
-- Run this entire file in Supabase SQL Editor (Project > SQL Editor)
-- ============================================================

-- ============================================================
-- 1. Reservations table
-- ============================================================
create table if not exists public.reservations (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  phone         text not null,
  email         text,
  items         jsonb not null,                 -- [{color, size, type, qty, unit_price}]
  total_amount  numeric(10,2) not null,         -- valor cheio
  reserve_amount numeric(10,2) not null,        -- 50% do total
  payment_proof_url text,                       -- url do arquivo no storage
  whatsapp_sent boolean not null default false,
  status        text not null default 'pendente' check (status in ('pendente','confirmado','cancelado')),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists reservations_created_at_idx on public.reservations (created_at desc);
create index if not exists reservations_status_idx on public.reservations (status);

-- updated_at trigger
-- `set search_path` fixo: sem isso o advisor de seguranca do Supabase acusa
-- "function_search_path_mutable".
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_reservations_updated_at on public.reservations;
create trigger trg_reservations_updated_at
  before update on public.reservations
  for each row execute function public.set_updated_at();

-- ============================================================
-- 2. RLS — public can INSERT a reservation, only admins can SELECT/UPDATE
-- ============================================================
alter table public.reservations enable row level security;

drop policy if exists "anyone can insert reservation" on public.reservations;
create policy "anyone can insert reservation"
  on public.reservations for insert
  to anon, authenticated
  with check (true);

drop policy if exists "authenticated can read all" on public.reservations;
create policy "authenticated can read all"
  on public.reservations for select
  to authenticated
  using (true);

drop policy if exists "authenticated can update" on public.reservations;
create policy "authenticated can update"
  on public.reservations for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can delete" on public.reservations;
create policy "authenticated can delete"
  on public.reservations for delete
  to authenticated
  using (true);

-- ============================================================
-- 3. Storage bucket for payment proofs
-- ============================================================
insert into storage.buckets (id, name, public)
  values ('comprovantes', 'comprovantes', true)
  on conflict (id) do nothing;

drop policy if exists "anyone can upload comprovante" on storage.objects;
create policy "anyone can upload comprovante"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'comprovantes');

drop policy if exists "anyone can read comprovante" on storage.objects;
create policy "anyone can read comprovante"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'comprovantes');

-- ============================================================
-- 0002_paid_in_full.sql
-- ============================================================
-- Coluna que marca quando o restante (100%) ja foi quitado
alter table public.reservations
  add column if not exists paid_in_full boolean not null default false;

create index if not exists reservations_paid_idx on public.reservations (paid_in_full);

-- ============================================================
-- 0003_payment_method.sql
-- ============================================================
-- Metodo de pagamento (PIX, cartao, dinheiro) informado pelo admin ao
-- registrar a reserva.
alter table public.reservations
  add column if not exists payment_method text
  check (payment_method in ('pix','cartao','dinheiro'));

-- ============================================================
-- 0004_settings.sql
-- ============================================================
-- Configuracao global do site (linha unica) — permite pausar as vendas/reservas
create table if not exists public.settings (
  id            boolean primary key default true,
  sales_paused  boolean not null default false,
  updated_at    timestamptz not null default now(),
  constraint settings_singleton check (id)
);

insert into public.settings (id, sales_paused)
  values (true, false)
  on conflict (id) do nothing;

drop trigger if exists trg_settings_updated_at on public.settings;
create trigger trg_settings_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

alter table public.settings enable row level security;

drop policy if exists "anyone can read settings" on public.settings;
create policy "anyone can read settings"
  on public.settings for select
  to anon, authenticated
  using (true);

drop policy if exists "authenticated can update settings" on public.settings;
create policy "authenticated can update settings"
  on public.settings for update
  to authenticated
  using (true)
  with check (true);

-- ============================================================
-- 0005_consulta_reserva.sql
-- ============================================================
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

-- ============================================================
-- 0006_edicao_e_historico.sql
-- ============================================================
-- ============================================================
-- Separa as reservas por edicao da conferencia e congela as antigas.
--
-- As 75 reservas da "Ate o Fim" viram historico: continuam visiveis e
-- exportaveis, mas NINGUEM mais altera ou apaga — e isso e garantido pela
-- RLS, nao pela interface. Esconder o botao no admin nao impediria um
-- UPDATE via API com a mesma sessao.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Qual edicao esta ativa (uma linha em settings, sem mexer em policy
--    quando virar a proxima conferencia)
-- ------------------------------------------------------------
alter table public.settings
  add column if not exists current_edition text not null default 'alem-do-palco';

create or replace function public.edicao_atual()
returns text
language sql
stable
set search_path = public
as $$
  select current_edition from public.settings where id;
$$;

-- ------------------------------------------------------------
-- 2. Coluna de edicao nas reservas
-- ------------------------------------------------------------
alter table public.reservations
  add column if not exists edition text;

-- Tudo que ja existia e da conferencia anterior: as vendas da nova so abriram
-- depois desta migration.
update public.reservations
   set edition = 'ate-o-fim'
 where edition is null;

alter table public.reservations
  alter column edition set default 'alem-do-palco';

alter table public.reservations
  alter column edition set not null;

create index if not exists reservations_edition_idx on public.reservations (edition);

-- ------------------------------------------------------------
-- 3. RLS: leitura de tudo, escrita so na edicao atual
-- ------------------------------------------------------------

-- INSERT: so deixa criar reserva na edicao corrente (o app nem manda a coluna,
-- o default resolve — isto e o cinto de seguranca).
drop policy if exists "anyone can insert reservation" on public.reservations;
create policy "anyone can insert reservation"
  on public.reservations for insert
  to anon, authenticated
  with check (edition = public.edicao_atual());

-- SELECT: a secretaria continua lendo tudo, inclusive o historico.
drop policy if exists "authenticated can read all" on public.reservations;
create policy "authenticated can read all"
  on public.reservations for select
  to authenticated
  using (true);

-- UPDATE: so na edicao atual, e sem poder mover a reserva para outra edicao.
drop policy if exists "authenticated can update" on public.reservations;
create policy "authenticated can update"
  on public.reservations for update
  to authenticated
  using (edition = public.edicao_atual())
  with check (edition = public.edicao_atual());

-- DELETE: idem — historico nao se apaga.
drop policy if exists "authenticated can delete" on public.reservations;
create policy "authenticated can delete"
  on public.reservations for delete
  to authenticated
  using (edition = public.edicao_atual());

-- ------------------------------------------------------------
-- 4. A consulta publica e o anexo de comprovante tambem respeitam a edicao
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

  if p_url not like '%/storage/v1/object/public/comprovantes/%' then
    raise exception 'URL de comprovante invalida';
  end if;

  update public.reservations r
     set payment_proof_url = p_url
   where length(public.so_digitos(p_phone)) >= 8
     and length(trim(coalesce(p_protocol, ''))) >= 8
     and right(public.so_digitos(r.phone), 8) = right(public.so_digitos(p_phone), 8)
     and upper(left(r.id::text, 8)) = upper(left(trim(p_protocol), 8))
     and r.status <> 'cancelado'
     -- historico e so leitura: nao aceita comprovante novo
     and r.edition = public.edicao_atual();

  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

revoke all on function public.anexar_comprovante(text, text, text) from public;
grant execute on function public.anexar_comprovante(text, text, text) to anon, authenticated;

-- ============================================================
-- 0007_remove_policies_duplicadas.sql
-- ============================================================
-- ============================================================
-- Remove policies permissivas genericas que nao vieram das migrations.
--
-- O banco tinha, alem das policies deste repo, um segundo conjunto criado
-- por fora (`auth_select`, `auth_update`, `auth_delete`, `public_insert`),
-- todas com `using (true)`. Policies PERMISSIVE sao combinadas com OR, entao
-- bastava uma delas liberar para a restricao de edicao nunca valer — foi o
-- que aconteceu: o historico continuava editavel mesmo com a policy nova.
--
-- `public_insert` ainda era mais larga que o necessario: dava INSERT ao role
-- `public` (qualquer um) sem checar a edicao.
--
-- As policies equivalentes deste repo cobrem todos os casos:
--   SELECT -> "authenticated can read all"
--   INSERT -> "anyone can insert reservation"  (anon + authenticated, edicao atual)
--   UPDATE -> "authenticated can update"       (so edicao atual)
--   DELETE -> "authenticated can delete"       (so edicao atual)
-- ============================================================

drop policy if exists "auth_select"   on public.reservations;
drop policy if exists "auth_update"   on public.reservations;
drop policy if exists "auth_delete"   on public.reservations;
drop policy if exists "public_insert" on public.reservations;
