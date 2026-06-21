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

-- Tabla de gastos (cierre de caja)
create table public.expenses (
  id uuid default gen_random_uuid() primary key,
  description text not null,
  amount numeric(10,2) not null,
  created_at timestamptz default now()
);

alter table public.expenses enable row level security;

create policy "Authenticated users can manage expenses"
  on public.expenses for all to authenticated using (true) with check (true);

-- Tabla de cierres de caja
create table public.cash_closings (
  id uuid default gen_random_uuid() primary key,
  date date not null unique,
  total_sales numeric(10,2) not null,
  total_expenses numeric(10,2) not null,
  result numeric(10,2) not null,
  closed_at timestamptz default now()
);

alter table public.cash_closings enable row level security;

create policy "Authenticated users can manage cash_closings"
  on public.cash_closings for all to authenticated using (true) with check (true);
