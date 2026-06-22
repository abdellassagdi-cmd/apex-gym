-- Full member intake profiles for admins and assigned coaches only.
create table if not exists public.member_intake (
  user_id uuid primary key references auth.users(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.member_intake enable row level security;

create policy member_intake_self_select on public.member_intake for select to authenticated
  using (user_id = (select auth.uid()));
create policy member_intake_self_insert on public.member_intake for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy member_intake_self_update on public.member_intake for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy member_intake_admin_select on public.member_intake for select to authenticated
  using (private.is_admin());
create policy member_intake_assigned_coach_select on public.member_intake for select to authenticated using (
  exists (select 1 from public.coach_assignments ca join public.coach_profiles cp on cp.id = ca.coach_id
    where ca.member_user_id = member_intake.user_id and ca.status = 'active'
      and cp.user_id = (select auth.uid()))
);
grant select, insert, update on public.member_intake to authenticated;

create policy user_settings_admin_select on public.user_settings for select to authenticated using (private.is_admin());
create policy user_settings_assigned_coach_select on public.user_settings for select to authenticated using (
  exists (select 1 from public.coach_assignments ca join public.coach_profiles cp on cp.id = ca.coach_id
    where ca.member_user_id = user_settings.user_id and ca.status = 'active'
      and cp.user_id = (select auth.uid()))
);
create policy workout_sessions_admin_select on public.workout_sessions for select to authenticated using (private.is_admin());
create policy workout_sessions_assigned_coach_select on public.workout_sessions for select to authenticated using (
  exists (select 1 from public.coach_assignments ca join public.coach_profiles cp on cp.id = ca.coach_id
    where ca.member_user_id = workout_sessions.user_id and ca.status = 'active'
      and cp.user_id = (select auth.uid()))
);
grant select on public.user_settings, public.workout_sessions to authenticated;
