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
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
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
