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
