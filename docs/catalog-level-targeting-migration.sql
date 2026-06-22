alter table public.exercise_content
  add column if not exists secondary_muscles text[] not null default '{}',
  add column if not exists difficulty_levels text[] not null default array['beginner','intermediate','advanced','athlete'],
  add column if not exists sets integer not null default 3,
  add column if not exists reps text not null default '8-12',
  add column if not exists weight text not null default 'Auto load',
  add column if not exists rest_seconds integer not null default 75,
  add column if not exists tempo text not null default '2-1-2',
  add column if not exists intensity text not null default 'hypertrophy';

create table if not exists public.program_content (
  id uuid primary key default gen_random_uuid(),
  program_key text not null unique,
  title text not null,
  subtitle text not null default '',
  environment text not null default 'Gym',
  difficulty_levels text[] not null default array['beginner','intermediate','advanced','athlete'],
  duration_weeks integer not null default 6,
  sessions_per_week integer not null default 3,
  target text not null default 'General fitness',
  image_url text not null,
  exercise_keys text[] not null default '{}',
  schedule jsonb not null default '[]'::jsonb,
  featured boolean not null default false,
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.program_content enable row level security;

drop policy if exists "Authenticated users read programs" on public.program_content;
create policy "Authenticated users read programs" on public.program_content
  for select to authenticated using (published or private.is_admin());

drop policy if exists "Admins manage programs" on public.program_content;
create policy "Admins manage programs" on public.program_content
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

grant select on public.program_content to authenticated;
grant insert, update, delete on public.program_content to authenticated;
grant select, insert, update, delete on public.exercise_content to authenticated;
