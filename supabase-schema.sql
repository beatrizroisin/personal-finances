-- ============================================================
-- FINANÇAS PESSOAIS — Schema Supabase
-- Execute este SQL no editor do Supabase (SQL Editor)
-- ============================================================

-- Extensão para UUID
create extension if not exists "uuid-ossp";

-- ─── TABELA: cards ───────────────────────────────────────────
create table if not exists public.cards (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  bank        text,
  card_limit  numeric default 0,
  color       text,
  last_four   text,
  created_at  timestamptz default now()
);
alter table public.cards enable row level security;
create policy "users_own_cards" on public.cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── TABELA: transactions ────────────────────────────────────
create table if not exists public.transactions (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount      numeric not null,
  category    text,
  date        text,
  type        text check (type in ('income','expense')),
  card_id     text,
  created_at  timestamptz default now()
);
alter table public.transactions enable row level security;
create policy "users_own_transactions" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── TABELA: bills ───────────────────────────────────────────
create table if not exists public.bills (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount      numeric not null,
  due_day     integer,
  paid        boolean default false,
  category    text,
  recurring   boolean default true,
  created_at  timestamptz default now()
);
alter table public.bills enable row level security;
create policy "users_own_bills" on public.bills
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── TABELA: installments ────────────────────────────────────
create table if not exists public.installments (
  id                  text primary key,
  user_id             uuid not null references auth.users(id) on delete cascade,
  description         text not null,
  monthly             numeric not null,
  total_installments  integer not null,
  paid                integer default 0,
  due_day             integer,
  card_id             text,
  start_date          text,
  created_at          timestamptz default now()
);
alter table public.installments enable row level security;
create policy "users_own_installments" on public.installments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── TABELA: investments ─────────────────────────────────────
create table if not exists public.investments (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount      numeric not null,
  return_pct  numeric,
  type        text,
  start_date  text,
  institution text,
  created_at  timestamptz default now()
);
alter table public.investments enable row level security;
create policy "users_own_investments" on public.investments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── TABELA: receivables (JSON blob — estrutura complexa) ────
create table if not exists public.receivables (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  data        jsonb not null,   -- armazena o objeto completo
  created_at  timestamptz default now()
);
alter table public.receivables enable row level security;
create policy "users_own_receivables" on public.receivables
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── TABELA: profiles ────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text,
  avatar_url text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "users_own_profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Trigger: cria perfil automaticamente ao criar usuário
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data->>'name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── TABELA: bank_accounts (contas bancárias com saldo real) ─────────────────
create table if not exists public.bank_accounts (
  id           text primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  bank         text not null,
  type         text default 'Conta Corrente',
  color        text,
  balance      numeric default 0,
  agency       text,
  account_num  text,
  notes        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
alter table public.bank_accounts enable row level security;
create policy "users_own_bank_accounts" on public.bank_accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── TABELA: balance_history (histórico de saldos por conta) ─────────────────
create table if not exists public.balance_history (
  id              text primary key,
  user_id         uuid not null references auth.users(id) on delete cascade,
  bank_account_id text not null references public.bank_accounts(id) on delete cascade,
  balance         numeric not null,
  recorded_at     date not null default current_date,
  created_at      timestamptz default now()
);
alter table public.balance_history enable row level security;
create policy "users_own_balance_history" on public.balance_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── ADD paid_month to bills (tracks which month was last marked paid) ────────
-- Run this if you already have the bills table created:
alter table public.bills add column if not exists paid_month text default null;
-- paid_month stores 'YYYY-MM', used to auto-reset recurring bills each new month

-- ─── ADD closing_day to cards ────────────────────────────────────────────────
alter table public.cards add column if not exists closing_day integer default 20;

-- ─── ADD purchase_date and billing_month to transactions ─────────────────────
alter table public.transactions add column if not exists purchase_date text default null;
alter table public.transactions add column if not exists billing_month text default null;

-- ─── TABELA: recurring_incomes (receitas fixas mensais) ──────────────────────
create table if not exists public.recurring_incomes (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount      numeric not null,
  day         integer not null,        -- dia do mês que cai (ex: 5 = dia 5)
  category    text default 'Renda',
  active      boolean default true,
  created_at  timestamptz default now()
);
alter table public.recurring_incomes enable row level security;
create policy "users_own_recurring_incomes" on public.recurring_incomes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- ─── TABELA: friendships ──────────────────────────────────────────────────────
create table if not exists public.friendships (
  id            text primary key default gen_random_uuid()::text,
  requester_id  uuid not null references auth.users(id) on delete cascade,
  addressee_id  uuid not null references auth.users(id) on delete cascade,
  status        text not null default 'pending'
                  check (status in ('pending','accepted','declined')),
  created_at    timestamptz default now(),
  unique(requester_id, addressee_id)
);
alter table public.friendships enable row level security;
create policy "users_own_friendships" on public.friendships
  for all using (auth.uid() = requester_id or auth.uid() = addressee_id)
  with check (auth.uid() = requester_id);

-- ─── TABELA: notifications ────────────────────────────────────────────────────
create table if not exists public.notifications (
  id            text primary key default gen_random_uuid()::text,
  user_id       uuid not null references auth.users(id) on delete cascade,
  from_user_id  uuid references auth.users(id) on delete set null,
  type          text not null,
  title         text not null,
  message       text not null,
  data          jsonb default '{}',
  read          boolean default false,
  created_at    timestamptz default now()
);
alter table public.notifications enable row level security;
create policy "users_own_notifications" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── VIEW: friends_with_profiles ─────────────────────────────────────────────
-- Returns accepted friends with their profile info
create or replace view public.friends_with_profiles as
  select
    f.id as friendship_id,
    f.status,
    f.created_at,
    case
      when f.requester_id = auth.uid() then f.addressee_id
      else f.requester_id
    end as friend_id,
    p.name as friend_name,
    p.avatar_url as friend_avatar
  from public.friendships f
  join public.profiles p on p.id = (
    case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
  )
  where (f.requester_id = auth.uid() or f.addressee_id = auth.uid());

-- ─── ADD email to profiles table ─────────────────────────────────────────────
-- Needed so users can be found by email
alter table public.profiles add column if not exists email text;

-- Update trigger to also save email
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, new.raw_user_meta_data->>'name', new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;