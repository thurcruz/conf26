-- Coluna que marca quando o restante (100%) ja foi quitado
alter table public.reservations
  add column if not exists paid_in_full boolean not null default false;

create index if not exists reservations_paid_idx on public.reservations (paid_in_full);
