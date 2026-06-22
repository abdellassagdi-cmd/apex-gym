-- Prevent recursive policy evaluation between coach_profiles and coach_assignments.

create or replace function private.current_coach_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.coach_profiles
  where user_id = (select auth.uid()) and status in ('active', 'away')
  limit 1;
$$;

create or replace function private.is_assigned_coach(target_member_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.coach_assignments ca
    join public.coach_profiles cp on cp.id = ca.coach_id
    where ca.member_user_id = target_member_user_id
      and ca.status = 'active'
      and cp.user_id = (select auth.uid())
      and cp.status in ('active', 'away')
  );
$$;

grant execute on function private.current_coach_id() to authenticated;
grant execute on function private.is_assigned_coach(uuid) to authenticated;

drop policy if exists coach_assignments_participant_select on public.coach_assignments;
create policy coach_assignments_participant_select on public.coach_assignments for select to authenticated
using (member_user_id = (select auth.uid()) or coach_id = private.current_coach_id() or private.is_admin());

drop policy if exists profiles_assigned_coach_select on public.profiles;
create policy profiles_assigned_coach_select on public.profiles for select to authenticated
using (private.is_assigned_coach(user_id));

drop policy if exists user_settings_assigned_coach_select on public.user_settings;
create policy user_settings_assigned_coach_select on public.user_settings for select to authenticated
using (private.is_assigned_coach(user_id));

drop policy if exists workout_sessions_assigned_coach_select on public.workout_sessions;
create policy workout_sessions_assigned_coach_select on public.workout_sessions for select to authenticated
using (private.is_assigned_coach(user_id));

drop policy if exists member_intake_assigned_coach_select on public.member_intake;
create policy member_intake_assigned_coach_select on public.member_intake for select to authenticated
using (private.is_assigned_coach(user_id));
