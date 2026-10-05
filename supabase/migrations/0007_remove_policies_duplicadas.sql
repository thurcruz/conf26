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
