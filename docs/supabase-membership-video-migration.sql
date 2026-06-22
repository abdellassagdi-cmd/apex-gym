-- Apex Gym: exact Free / Plus / Pro access, owner videos, and coach accounts.

update public.plans set
  description = 'All exercises with GIF demonstrations and sponsored placements.',
  entitlements = '{"all_exercises":true,"exercise_limit":null,"show_ads":true,"video_access":false,"coach_chat":false,"priority_support":false}'::jsonb,
  sort_order = 1
where code = 'free';

update public.plans set
  description = 'No ads and full access to owner-recorded exercise videos.',
  entitlements = '{"all_exercises":true,"exercise_limit":null,"show_ads":false,"video_access":true,"coach_chat":false,"priority_support":false}'::jsonb,
  sort_order = 2
where code = 'plus';

update public.plans set
  description = 'Everything in Plus with a dedicated coach and direct messaging.',
  entitlements = '{"all_exercises":true,"exercise_limit":null,"show_ads":false,"video_access":true,"coach_chat":true,"priority_support":true}'::jsonb,
  sort_order = 3
where code = 'pro';

create table if not exists public.exercise_content (
  id uuid primary key default gen_random_uuid(),
  exercise_key text not null unique,
  name text not null,
  target_muscle text not null,
  equipment text not null default 'Gym equipment',
  gif_url text not null,
  video_url text,
  video_storage_path text,
  coach_cue text not null default '',
  instructions text[] not null default '{}',
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.exercise_content enable row level security;
drop policy if exists exercise_content_authenticated_select on public.exercise_content;
create policy exercise_content_authenticated_select on public.exercise_content
  for select to authenticated using (published or private.is_admin());
drop policy if exists exercise_content_admin_all on public.exercise_content;
create policy exercise_content_admin_all on public.exercise_content
  for all to authenticated using (private.is_admin()) with check (private.is_admin());
grant select, insert, update, delete on public.exercise_content to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('exercise-videos', 'exercise-videos', true, 524288000, array['video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists exercise_videos_admin_insert on storage.objects;
create policy exercise_videos_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'exercise-videos' and private.is_admin());
drop policy if exists exercise_videos_admin_update on storage.objects;
create policy exercise_videos_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'exercise-videos' and private.is_admin())
  with check (bucket_id = 'exercise-videos' and private.is_admin());
drop policy if exists exercise_videos_admin_delete on storage.objects;
create policy exercise_videos_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'exercise-videos' and private.is_admin());

create or replace function private.link_apex_coach_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.coach_profiles
  set user_id = new.id, status = 'active', updated_at = now()
  where lower(email) = lower(new.email) and user_id is null;
  return new;
end;
$$;

drop trigger if exists on_auth_user_link_apex_coach on auth.users;
create trigger on_auth_user_link_apex_coach
  after insert or update of email on auth.users
  for each row execute procedure private.link_apex_coach_account();

-- Existing verified accounts are linked too, so a coach can be created before or after signup.
update public.coach_profiles cp set user_id = u.id, status = 'active', updated_at = now()
from auth.users u where cp.user_id is null and lower(cp.email) = lower(u.email);

drop policy if exists profiles_assigned_coach_select on public.profiles;
create policy profiles_assigned_coach_select on public.profiles for select to authenticated using (
  exists (
    select 1 from public.coach_assignments ca
    join public.coach_profiles cp on cp.id = ca.coach_id
    where ca.member_user_id = profiles.user_id and ca.status = 'active' and cp.user_id = auth.uid()
  )
);

create unique index if not exists conversations_one_per_member_idx on public.conversations (member_user_id);

-- Activate the allowlisted owner even if the Auth account existed before the original trigger.
insert into public.admin_members (user_id, role, status)
select u.id, a.role, 'active'
from auth.users u join private.admin_allowlist a on lower(a.email) = lower(u.email)
on conflict (user_id) do update set role = excluded.role, status = 'active';

-- Keep paid video locations separate so Free members cannot read them through the API.
create table if not exists public.exercise_video_assets (
  exercise_key text primary key references public.exercise_content(exercise_key) on delete cascade,
  video_url text not null,
  video_storage_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.exercise_video_assets (exercise_key, video_url, video_storage_path)
select exercise_key, video_url, video_storage_path from public.exercise_content
where video_url is not null and video_storage_path is not null
on conflict (exercise_key) do update set video_url = excluded.video_url,
  video_storage_path = excluded.video_storage_path, updated_at = now();
update public.exercise_content set video_url = null, video_storage_path = null
where video_url is not null or video_storage_path is not null;
alter table public.exercise_video_assets enable row level security;
drop policy if exists exercise_video_assets_paid_select on public.exercise_video_assets;
create policy exercise_video_assets_paid_select on public.exercise_video_assets for select to authenticated using (
  private.is_admin() or exists (
    select 1 from public.subscriptions s where s.user_id = (select auth.uid())
      and s.status in ('active', 'trialing') and s.plan_code in ('plus', 'pro')
  )
);
drop policy if exists exercise_video_assets_admin_all on public.exercise_video_assets;
create policy exercise_video_assets_admin_all on public.exercise_video_assets for all to authenticated
  using (private.is_admin()) with check (private.is_admin());
grant select, insert, update, delete on public.exercise_video_assets to authenticated;

drop policy if exists coach_profiles_member_select on public.coach_profiles;
create policy coach_profiles_member_select on public.coach_profiles for select to authenticated using (
  private.is_admin() or user_id = (select auth.uid()) or exists (
    select 1 from public.coach_assignments ca where ca.coach_id = coach_profiles.id
      and ca.member_user_id = (select auth.uid()) and ca.status = 'active'
  )
);
drop policy if exists ad_campaigns_active_select on public.ad_campaigns;
create policy ad_campaigns_active_select on public.ad_campaigns for select to authenticated using (
  private.is_admin() or (
    status = 'active' and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now())
    and exists (select 1 from public.subscriptions s where s.user_id = (select auth.uid())
      and s.status in ('active', 'trialing') and s.plan_code = 'free')
  )
);
