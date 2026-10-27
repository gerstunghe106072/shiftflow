create extension if not exists pgcrypto;

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  employer text not null check (char_length(trim(employer)) between 1 and 120),
  date date not null,
  start_time time not null,
  end_time time not null,
  pause boolean not null default false,
  hourly_rate numeric(10, 2) not null check (hourly_rate >= 0),
  tips numeric(10, 2) not null default 0 check (tips >= 0),
  hours numeric(6, 2) not null check (hours between 0 and 24),
  wage numeric(12, 2) not null check (wage >= 0),
  created_at timestamptz not null default now()
);

create index if not exists shifts_user_date_idx
  on public.shifts (user_id, date desc);

create table if not exists public.monthly_payouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year integer not null check (year between 2000 and 2100),
  month integer not null check (month between 1 and 12),
  amount numeric(12, 2) not null check (amount >= 0),
  updated_at timestamptz not null default now(),
  constraint monthly_payouts_user_month_key unique (user_id, year, month)
);

create index if not exists monthly_payouts_user_year_idx
  on public.monthly_payouts (user_id, year);

alter table public.shifts enable row level security;
alter table public.monthly_payouts enable row level security;

drop policy if exists "Users can read own shifts" on public.shifts;
drop policy if exists "Users can insert own shifts" on public.shifts;
drop policy if exists "Users can update own shifts" on public.shifts;
drop policy if exists "Users can delete own shifts" on public.shifts;

create policy "Users can read own shifts"
  on public.shifts for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own shifts"
  on public.shifts for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own shifts"
  on public.shifts for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own shifts"
  on public.shifts for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own payouts" on public.monthly_payouts;
drop policy if exists "Users can insert own payouts" on public.monthly_payouts;
drop policy if exists "Users can update own payouts" on public.monthly_payouts;
drop policy if exists "Users can delete own payouts" on public.monthly_payouts;

create policy "Users can read own payouts"
  on public.monthly_payouts for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own payouts"
  on public.monthly_payouts for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own payouts"
  on public.monthly_payouts for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own payouts"
  on public.monthly_payouts for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.shifts from anon;
revoke all on table public.monthly_payouts from anon;
grant select, insert, update, delete on table public.shifts to authenticated;
grant select, insert, update, delete on table public.monthly_payouts to authenticated;
