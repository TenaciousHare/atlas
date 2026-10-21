-- =========================================
-- A.T.L.A.S. — schemat bazy (Supabase)
-- Źródło prawdy: ten plik. Zmiany w bazie
-- robię w SQL Editorze i dopisuję tutaj.
-- =========================================

-- -----------------------------------------
-- daily_logs — dzienne metryki
-- -----------------------------------------
-- tabela
create table public.daily_logs (
  user_id uuid not null,
  date date not null,
  weight_kg numeric(5, 2) null,
  waist_cm numeric(4, 1) null,
  steps integer null,
  fasting boolean not null default false,
  notes text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint daily_logs_pkey primary key (user_id, date),
  constraint daily_logs_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

-- uprawnienia
grant select, insert, update, delete
  on public.daily_logs
  to authenticated;

-- RLS
alter table public.daily_logs enable row level security;

create policy "Users manage their own logs"
  on public.daily_logs
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- -----------------------------------------
-- exercises — baza ćwiczeń
-- -----------------------------------------
-- tabela
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  name text not null,
  measure text not null check (measure in ('reps', 'time')),
  uses_weight boolean not null default false,
  unilateral boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercises_user_name_key unique (user_id, name)
);

-- uprawnienia
grant select, insert, update, delete
  on public.exercises
  to authenticated;

-- RLS
alter table public.exercises enable row level security;

create policy "exercises: tylko własne"
  on public.exercises
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

