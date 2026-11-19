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

-- indeksy
-- zabezpieczenie przed dodawaniem tych samych ćwiczeń, różniących się spacją lub wielkością liter
create unique index exercises_user_name_ci_key on public.exercises (user_id, lower(trim(name)));

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

-- -----------------------------------------
-- workout_templates — plany treningowe (A1, A2, B)
-- -----------------------------------------
-- tabela
create table public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- indeksy
-- nazwa planu unikalna bez względu na wielkość liter i spacje
create unique index workout_templates_user_name_ci_key
  on public.workout_templates (user_id, lower(trim(name)));

-- uprawnienia
grant select, insert, update, delete
  on public.workout_templates
  to authenticated;

-- RLS
alter table public.workout_templates enable row level security;

create policy "workout_templates: tylko własne"
  on public.workout_templates
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- -----------------------------------------
-- template_exercises — ćwiczenia w planie (tabela łącząca)
-- -----------------------------------------
-- tabela
create table public.template_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  template_id uuid not null
    references public.workout_templates (id) on delete cascade,
  exercise_id uuid not null
    references public.exercises (id) on delete restrict,
  position integer not null check (position > 0),
  block text not null default 'main'
    check (block in ('warmup', 'main', 'cooldown')),
  sets integer not null default 1 check (sets > 0),
  scheme text not null default 'straight'
    check (scheme in ('straight', 'ladder')),
  target_min integer null check (target_min > 0),
  target_max integer null check (target_max > 0),
  target_seconds integer null check (target_seconds > 0),
  ladder_step integer null check (ladder_step > 0),
  ladder_top integer null check (ladder_top > 0),
  weight_kg numeric(5, 2) null check (weight_kg >= 0),
  box_cm numeric(4, 1) null check (box_cm > 0),
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint template_exercises_target_range_check
    check (target_min <= target_max),
  constraint template_exercises_ladder_check
    check (scheme <> 'ladder' or (ladder_step is not null and ladder_top is not null)),
  constraint template_exercises_ladder_range_check
    check (ladder_step <= ladder_top)
);

-- indeksy
-- szybkie pobieranie ćwiczeń planu, od razu w kolejności
create index template_exercises_template_position_idx
  on public.template_exercises (template_id, position);
-- szybkie sprawdzanie, czy ćwiczenie jest używane w jakimś planie
create index template_exercises_exercise_idx
  on public.template_exercises (exercise_id);

-- uprawnienia
grant select, insert, update, delete
  on public.template_exercises
  to authenticated;

-- RLS
alter table public.template_exercises enable row level security;

create policy "template_exercises: tylko własne"
  on public.template_exercises
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.workout_templates t
      where t.id = template_id and t.user_id = auth.uid()
    )
    and exists (
      select 1 from public.exercises e
      where e.id = exercise_id and e.user_id = auth.uid()
    )
  );

  -- -----------------------------------------
-- workout_sessions — wykonane treningi
-- -----------------------------------------
-- tabela
create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  template_id uuid null
    references public.workout_templates (id) on delete set null,
  date date not null default current_date,
  notes text null,
  finished_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- indeksy
-- szybka lista treningów, od najnowszego
create index workout_sessions_user_date_idx
  on public.workout_sessions (user_id, date desc);

-- uprawnienia
grant select, insert, update, delete
  on public.workout_sessions
  to authenticated;

-- RLS
alter table public.workout_sessions enable row level security;

create policy "workout_sessions: tylko własne"
  on public.workout_sessions
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      template_id is null
      or exists (
        select 1 from public.workout_templates t
        where t.id = template_id and t.user_id = auth.uid()
      )
    )
  );

-- -----------------------------------------
-- session_sets — wykonane wysiłki (seria / szczebel / strona)
-- -----------------------------------------
-- tabela
create table public.session_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  session_id uuid not null
    references public.workout_sessions (id) on delete cascade,
  exercise_id uuid not null
    references public.exercises (id) on delete restrict,
  position integer not null check (position > 0),
  set_no integer not null check (set_no > 0),
  rung_no integer null check (rung_no > 0),
  side text null check (side in ('L', 'R')),
  reps integer null check (reps >= 0),
  seconds integer null check (seconds >= 0),
  weight_kg numeric(5, 2) null check (weight_kg >= 0),
  box_cm numeric(4, 1) null check (box_cm > 0),
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint session_sets_slot_key
    unique nulls not distinct (session_id, position, set_no, rung_no, side)
);

-- indeksy
-- szybkie pobieranie serii treningu, od razu w kolejności
-- (unikalny klucz session_sets_slot_key już tworzy taki indeks)
-- szybkie liczenie rekordów jednego ćwiczenia
create index session_sets_exercise_idx
  on public.session_sets (exercise_id);

-- uprawnienia
grant select, insert, update, delete
  on public.session_sets
  to authenticated;

-- RLS
alter table public.session_sets enable row level security;

create policy "session_sets: tylko własne"
  on public.session_sets
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
    and exists (
      select 1 from public.exercises e
      where e.id = exercise_id and e.user_id = auth.uid()
    )
  );
