-- Hoan Tien Sale - initial schema
create extension if not exists pgcrypto;

create type public.platform as enum ('shopee', 'lazada', 'tiktok');
create type public.order_status as enum ('pending', 'approved', 'rejected', 'paid');
create type public.withdrawal_status as enum ('requested', 'processing', 'paid', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table public.affiliate_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  platform public.platform not null,
  original_url text not null,
  affiliate_url text,
  tracking_id text not null unique,
  clicks integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  platform public.platform not null,
  external_order_id text not null,
  tracking_id text,
  product_name text,
  order_value numeric(14,2) not null default 0,
  commission numeric(14,2) not null default 0,
  cashback numeric(14,2) not null default 0,
  status public.order_status not null default 'pending',
  ordered_at timestamptz,
  approved_at timestamptz,
  paid_at timestamptz,
  imported_at timestamptz not null default now(),
  raw_data jsonb not null default '{}'::jsonb,
  unique(platform, external_order_id)
);

create table public.wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  type text not null check (type in ('cashback', 'adjustment', 'withdrawal')),
  amount numeric(14,2) not null,
  note text,
  created_at timestamptz not null default now()
);

create table public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  bank_name text,
  account_name text,
  account_number text,
  status public.withdrawal_status not null default 'requested',
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index affiliate_links_user_idx on public.affiliate_links(user_id);
create index affiliate_links_tracking_idx on public.affiliate_links(tracking_id);
create index orders_user_idx on public.orders(user_id);
create index orders_tracking_idx on public.orders(tracking_id);
create index orders_status_idx on public.orders(status);

alter table public.profiles enable row level security;
alter table public.affiliate_links enable row level security;
alter table public.orders enable row level security;
alter table public.wallet_ledger enable row level security;
alter table public.withdrawals enable row level security;

create policy "users can read own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "users can update own profile"
on public.profiles for update
using (auth.uid() = id);

create policy "users can read own links"
on public.affiliate_links for select
using (auth.uid() = user_id);

create policy "users can insert own links"
on public.affiliate_links for insert
with check (auth.uid() = user_id or user_id is null);

create policy "users can read own orders"
on public.orders for select
using (auth.uid() = user_id);

create policy "users can read own ledger"
on public.wallet_ledger for select
using (auth.uid() = user_id);

create policy "users can read own withdrawals"
on public.withdrawals for select
using (auth.uid() = user_id);

create policy "users can create withdrawals"
on public.withdrawals for insert
with check (auth.uid() = user_id);

-- Create profile automatically after signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();