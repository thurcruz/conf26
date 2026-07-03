-- Metodo de pagamento (PIX, cartao, dinheiro) informado pelo admin ao
-- registrar a reserva.
alter table public.reservations
  add column if not exists payment_method text
  check (payment_method in ('pix','cartao','dinheiro'));
