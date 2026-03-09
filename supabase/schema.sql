-- ─────────────────────────────────────────────────────────────
-- REPPO — Supabase Database Schema
-- Run this in: Supabase → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── USERS (extends Supabase auth.users) ──────────────────────
-- Supabase auth handles the core user record.
-- We store app-specific profile data here.
create table if not exists public.profiles (
  id                uuid references auth.users(id) on delete cascade primary key,
  name              text,
  onboarding_done   boolean default false,
  created_at        timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── SPLITS ───────────────────────────────────────────────────
-- A user's training structure (PPL, Upper/Lower, etc.)
create table if not exists public.splits (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  type        text not null check (type in ('ppl','upper_lower','full_body','custom')),
  name        text not null default 'My Program',
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- ─── SPLIT DAYS ───────────────────────────────────────────────
-- Individual training days within a split (e.g. Push A, Pull B)
create table if not exists public.split_days (
  id          uuid primary key default uuid_generate_v4(),
  split_id    uuid references public.splits(id) on delete cascade not null,
  day_name    text not null,   -- "Push A", "Pull B", "Legs A"
  day_type    text not null,   -- "push", "pull", "legs", "upper", "lower", "full"
  sort_order  integer default 0
);

-- ─── EXERCISES ────────────────────────────────────────────────
-- Global exercise library (seeded, not user-specific)
create table if not exists public.exercises (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null unique,
  muscle_group  text not null,  -- "chest", "back", "shoulders", "quads", etc.
  movement_type text not null,  -- "compound", "isolation"
  equipment     text,           -- "barbell", "dumbbell", "cable", "bodyweight", "machine"
  is_seeded     boolean default true
);

-- ─── PLAN EXERCISES ───────────────────────────────────────────
-- Links exercises to days, with rep/set targets
create table if not exists public.plan_exercises (
  id              uuid primary key default uuid_generate_v4(),
  split_day_id    uuid references public.split_days(id) on delete cascade not null,
  exercise_id     uuid references public.exercises(id) not null,
  target_sets     integer default 3,
  target_rep_min  integer default 6,
  target_rep_max  integer default 8,
  track_1rm       boolean default false,  -- whether to calculate 1RM for this exercise
  sort_order      integer default 0
);

-- ─── WORKOUTS ─────────────────────────────────────────────────
-- A single gym session
create table if not exists public.workouts (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  split_day_id  uuid references public.split_days(id),
  started_at    timestamptz not null default now(),
  ended_at      timestamptz,
  notes         text,
  created_at    timestamptz default now()
);

-- ─── SETS ─────────────────────────────────────────────────────
-- Individual logged sets (the core data row)
create table if not exists public.sets (
  id            uuid primary key default uuid_generate_v4(),
  workout_id    uuid references public.workouts(id) on delete cascade not null,
  exercise_id   uuid references public.exercises(id) not null,
  set_number    integer not null,
  weight_kg     numeric(6,2) not null,
  reps          integer not null,
  is_warmup     boolean default false,
  is_pr         boolean default false,
  rpe           numeric(3,1),  -- optional: Rate of Perceived Exertion (6.0–10.0)
  logged_at     timestamptz default now()
);

-- ─── ESTIMATED 1RMS ───────────────────────────────────────────
-- Rolling weighted average 1RM per exercise per user.
-- Updated after every session save.
create table if not exists public.estimated_1rms (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  exercise_id     uuid references public.exercises(id) not null,
  value_kg        numeric(6,2) not null,
  calculated_at   timestamptz default now(),
  session_count   integer default 1,  -- how many sessions contributed
  unique (user_id, exercise_id)
);

-- ─── PLATEAU ALERTS ───────────────────────────────────────────
-- Log of detected plateaus and user responses
create table if not exists public.plateau_alerts (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  exercise_id     uuid references public.exercises(id) not null,
  triggered_at    timestamptz default now(),
  dismissed_at    timestamptz,
  action_taken    text  -- "deload", "variation", "volume", "dismissed"
);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────
-- Users can only read/write their own data

alter table public.profiles       enable row level security;
alter table public.splits         enable row level security;
alter table public.split_days     enable row level security;
alter table public.plan_exercises enable row level security;
alter table public.workouts       enable row level security;
alter table public.sets           enable row level security;
alter table public.estimated_1rms enable row level security;
alter table public.plateau_alerts enable row level security;
alter table public.exercises      enable row level security;

-- Profiles: own row only
create policy "Users can view own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Splits
create policy "Users manage own splits" on public.splits for all using (auth.uid() = user_id);

create policy "Users manage own split_days" on public.split_days for all
  using (exists (select 1 from public.splits s where s.id = split_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.splits s where s.id = split_id and s.user_id = auth.uid()));

create policy "Users manage own plan_exercises" on public.plan_exercises for all
  using (exists (select 1 from public.split_days sd join public.splits s on s.id = sd.split_id where sd.id = split_day_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.split_days sd join public.splits s on s.id = sd.split_id where sd.id = split_day_id and s.user_id = auth.uid()));

-- Workouts + sets
create policy "Users manage own workouts"  on public.workouts       for all using (auth.uid() = user_id);
create policy "Users manage own sets"      on public.sets           for all
  using (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));
create policy "Users manage own 1rms"      on public.estimated_1rms for all using (auth.uid() = user_id);
create policy "Users manage own alerts"    on public.plateau_alerts  for all using (auth.uid() = user_id);

-- Exercises: everyone can read the global library
create policy "Anyone can read exercises"  on public.exercises for select using (true);

-- ─── SEED: EXERCISE LIBRARY ───────────────────────────────────
insert into public.exercises (name, muscle_group, movement_type, equipment) values
  -- Push — Chest
  ('Bench Press',            'chest',     'compound',  'barbell'),
  ('Incline Bench Press',    'chest',     'compound',  'barbell'),
  ('Incline DB Press',       'chest',     'compound',  'dumbbell'),
  ('DB Fly',                 'chest',     'isolation', 'dumbbell'),
  ('Cable Fly',              'chest',     'isolation', 'cable'),
  ('Push Up',                'chest',     'compound',  'bodyweight'),

  -- Push — Shoulders
  ('Overhead Press',         'shoulders', 'compound',  'barbell'),
  ('DB Shoulder Press',      'shoulders', 'compound',  'dumbbell'),
  ('Lateral Raise',          'shoulders', 'isolation', 'dumbbell'),
  ('Front Raise',            'shoulders', 'isolation', 'dumbbell'),
  ('Face Pull',              'shoulders', 'isolation', 'cable'),

  -- Push — Triceps
  ('Tricep Pushdown',        'triceps',   'isolation', 'cable'),
  ('Overhead Tricep Ext',    'triceps',   'isolation', 'cable'),
  ('Skull Crusher',          'triceps',   'isolation', 'barbell'),
  ('Close Grip Bench',       'triceps',   'compound',  'barbell'),
  ('Dips',                   'triceps',   'compound',  'bodyweight'),

  -- Pull — Back
  ('Deadlift',               'back',      'compound',  'barbell'),
  ('Barbell Row',            'back',      'compound',  'barbell'),
  ('Lat Pulldown',           'back',      'compound',  'cable'),
  ('Cable Row',              'back',      'compound',  'cable'),
  ('DB Row',                 'back',      'compound',  'dumbbell'),
  ('Pull Up',                'back',      'compound',  'bodyweight'),
  ('Chest Supported Row',    'back',      'compound',  'machine'),

  -- Pull — Biceps
  ('Bicep Curl',             'biceps',    'isolation', 'barbell'),
  ('DB Curl',                'biceps',    'isolation', 'dumbbell'),
  ('Hammer Curl',            'biceps',    'isolation', 'dumbbell'),
  ('Cable Curl',             'biceps',    'isolation', 'cable'),
  ('Preacher Curl',          'biceps',    'isolation', 'machine'),

  -- Legs — Quads
  ('Squat',                  'quads',     'compound',  'barbell'),
  ('Front Squat',            'quads',     'compound',  'barbell'),
  ('Leg Press',              'quads',     'compound',  'machine'),
  ('Leg Extension',          'quads',     'isolation', 'machine'),
  ('Bulgarian Split Squat',  'quads',     'compound',  'dumbbell'),
  ('Hack Squat',             'quads',     'compound',  'machine'),

  -- Legs — Hamstrings / Glutes
  ('Romanian Deadlift',      'hamstrings','compound',  'barbell'),
  ('Leg Curl',               'hamstrings','isolation', 'machine'),
  ('Good Morning',           'hamstrings','compound',  'barbell'),
  ('Hip Thrust',             'glutes',    'compound',  'barbell'),
  ('Glute Bridge',           'glutes',    'isolation', 'bodyweight'),

  -- Legs — Calves
  ('Calf Raise',             'calves',    'isolation', 'machine'),
  ('Seated Calf Raise',      'calves',    'isolation', 'machine')

on conflict (name) do nothing;
