-- Adds payment-method breakdown to cash closings.
-- Nullable on purpose: existing closings have no breakdown recorded, so NULL
-- distinguishes "unknown" from an actual zero.

alter table public.cash_closings
  add column if not exists total_efectivo numeric(10,2),
  add column if not exists total_mercadopago numeric(10,2);
