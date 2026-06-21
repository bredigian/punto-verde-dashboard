-- Tabla de ventas
create table public.sales (
  id uuid default gen_random_uuid() primary key,
  product_name text not null,
  category text not null check (category in ('verduras', 'pollo')),
  quantity numeric(10,3) not null default 1,
  unit_price numeric(10,2) not null,
  total numeric(10,2) not null,
  payment_method text not null default 'efectivo' check (payment_method in ('efectivo', 'mercadopago')),
  created_at timestamptz default now()
);

-- Row Level Security
alter table public.sales enable row level security;

create policy "Authenticated users can manage sales"
  on public.sales for all to authenticated using (true) with check (true);
