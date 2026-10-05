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
