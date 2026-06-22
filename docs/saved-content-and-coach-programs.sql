create table if not exists public.member_saved_content (
  user_id uuid primary key references auth.users(id) on delete cascade,
  favorite_exercise_keys text[] not null default '{}',
  favorite_program_keys text[] not null default '{}',
  custom_programs jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.coach_member_programs (
  id uuid primary key default gen_random_uuid(),
  member_user_id uuid not null references auth.users(id) on delete cascade,
  coach_id uuid not null references public.coach_profiles(id) on delete cascade,
  program_data jsonb not null,
  starts_on date,
  status text not null default 'active' check (status in ('draft','active','completed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists coach_member_programs_member_status_idx on public.coach_member_programs(member_user_id, status);
create index if not exists coach_member_programs_coach_status_idx on public.coach_member_programs(coach_id, status);

alter table public.member_saved_content enable row level security;
alter table public.coach_member_programs enable row level security;

create policy "Members manage own saved content" on public.member_saved_content
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Members read assigned programs" on public.coach_member_programs
for select to authenticated using (member_user_id = auth.uid() or private.is_admin());

create policy "Coaches manage their member programs" on public.coach_member_programs
for all to authenticated
using (private.is_admin() or exists (select 1 from public.coach_profiles cp where cp.id = coach_id and cp.user_id = auth.uid()))
with check (private.is_admin() or exists (select 1 from public.coach_profiles cp where cp.id = coach_id and cp.user_id = auth.uid()));

grant select, insert, update, delete on public.member_saved_content to authenticated;
grant select, insert, update, delete on public.coach_member_programs to authenticated;
