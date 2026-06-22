-- Apex Gym user data schema.
-- Run this in the Supabase SQL Editor after creating the project.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Apex Member',
  weight numeric(5, 1) not null default 82.4,
  height integer not null default 178,
  fitness_level text not null default 'Intermediate'
    check (fitness_level in ('Beginner', 'Intermediate', 'Advanced', 'Athlete')),
  goal text not null default 'Strength gain',
  training_days_per_week integer not null default 3
    check (training_days_per_week between 1 and 7),
  preferred_intensity text not null default 'Challenging'
    check (preferred_intensity in ('Easy', 'Light sweat', 'Challenging', 'Progressive')),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  health text[] not null default array['No current restrictions'],
  equipment text not null default 'Full commercial gym',
  privacy text[] not null default array['Workout analytics', 'Body metrics'],
  reminder jsonb not null default '{"enabled":false,"hour":18,"minute":30,"weekdays":[2,4,6]}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_sessions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  exercise_count integer not null check (exercise_count >= 0),
  total_sets integer not null check (total_sets >= 0),
  completed_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists workout_sessions_user_completed_at_idx
  on public.workout_sessions (user_id, completed_at desc);

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.workout_sessions enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() is not null and auth.uid() = user_id)
  with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "Users can read their own settings" on public.user_settings;
create policy "Users can read their own settings"
  on public.user_settings
  for select
  to authenticated
  using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "Users can create their own settings" on public.user_settings;
create policy "Users can create their own settings"
  on public.user_settings
  for insert
  to authenticated
  with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "Users can update their own settings" on public.user_settings;
create policy "Users can update their own settings"
  on public.user_settings
  for update
  to authenticated
  using (auth.uid() is not null and auth.uid() = user_id)
  with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "Users can read their own workout sessions" on public.workout_sessions;
create policy "Users can read their own workout sessions"
  on public.workout_sessions
  for select
  to authenticated
  using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "Users can create their own workout sessions" on public.workout_sessions;
create policy "Users can create their own workout sessions"
  on public.workout_sessions
  for insert
  to authenticated
  with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "Users can update their own workout sessions" on public.workout_sessions;
create policy "Users can update their own workout sessions"
  on public.workout_sessions
  for update
  to authenticated
  using (auth.uid() is not null and auth.uid() = user_id)
  with check (auth.uid() is not null and auth.uid() = user_id);

-- Membership, staff, exercise video, and coaching schema.
-- This section is intentionally idempotent so it can be re-run after the base schema.

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists account_status text not null default 'active';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists last_active_at timestamptz;

create table if not exists public.plans (
  code text primary key check (code in ('free', 'plus', 'pro')),
  name text not null,
  description text not null,
  monthly_price numeric(10, 2) not null default 0,
  yearly_price numeric(10, 2) not null default 0,
  currency text not null default 'MAD',
  entitlements jsonb not null,
  active boolean not null default true,
  sort_order integer not null
);

insert into public.plans (code, name, description, monthly_price, yearly_price, entitlements, sort_order)
values
  ('free', 'Free', 'All exercises with GIF demonstrations and sponsored placements.', 0, 0,
   '{"all_exercises":true,"exercise_limit":null,"show_ads":true,"video_access":false,"coach_chat":false,"priority_support":false}'::jsonb, 1),
  ('plus', 'Plus', 'No ads and full access to admin-recorded exercise videos.', 79, 790,
   '{"all_exercises":true,"exercise_limit":null,"show_ads":false,"video_access":true,"coach_chat":false,"priority_support":false}'::jsonb, 2),
  ('pro', 'Pro', 'Everything in Plus with a dedicated coach and direct messaging.', 199, 1990,
   '{"all_exercises":true,"exercise_limit":null,"show_ads":false,"video_access":true,"coach_chat":true,"priority_support":true}'::jsonb, 3)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  entitlements = excluded.entitlements,
  sort_order = excluded.sort_order;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plan_code text not null default 'free' references public.plans(code),
  status text not null default 'active',
  provider text not null default 'manual',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin',
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.coach_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  email text not null unique,
  status text not null default 'active',
  max_clients integer not null default 20 check (max_clients > 0),
  specialties text[] not null default '{}',
  response_sla_minutes integer not null default 720,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coach_assignments (
  id uuid primary key default gen_random_uuid(),
  member_user_id uuid not null references auth.users(id) on delete cascade,
  coach_id uuid not null references public.coach_profiles(id) on delete cascade,
  status text not null default 'active',
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
create unique index if not exists coach_assignments_one_active_member_idx
  on public.coach_assignments (member_user_id) where status = 'active';

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

create table if not exists public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.coach_assignments(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists coach_messages_assignment_created_idx
  on public.coach_messages (assignment_id, created_at);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  member_user_id uuid not null unique references auth.users(id) on delete cascade,
  coach_id uuid not null references public.coach_profiles(id) on delete cascade,
  status text not null default 'open',
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_user_id uuid references auth.users(id) on delete set null,
  sender_kind text not null,
  body text not null check (char_length(body) between 1 and 4000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists messages_conversation_created_idx on public.messages (conversation_id, created_at);

create table if not exists public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  placement text not null,
  headline text not null,
  status text not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_type text not null,
  processing_status text not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create schema if not exists private;

create table if not exists private.admin_allowlist (
  email text primary key,
  role text not null default 'owner',
  created_at timestamptz not null default now()
);

insert into private.admin_allowlist (email, role)
values ('abdellassagdi@gmail.com', 'owner')
on conflict (email) do update set role = excluded.role;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_members
    where user_id = auth.uid() and status = 'active'
  );
$$;

create or replace function private.current_coach_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.coach_profiles
  where user_id = auth.uid() and status in ('active', 'away')
  limit 1;
$$;

grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.current_coach_id() to authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)))
  on conflict (user_id) do update set email = excluded.email;

  insert into public.subscriptions (user_id, plan_code, status, provider)
  values (new.id, 'free', 'active', 'manual')
  on conflict (user_id) do nothing;

  insert into public.admin_members (user_id, role, status)
  select new.id, a.role, 'active'
  from private.admin_allowlist a
  where lower(a.email) = lower(new.email)
  on conflict (user_id) do update set role = excluded.role, status = 'active';

  update public.coach_profiles
  set user_id = new.id, status = 'active'
  where lower(email) = lower(new.email) and user_id is null;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_apex on auth.users;
create trigger on_auth_user_created_apex
  after insert or update of email on auth.users
  for each row execute procedure private.handle_new_user();

alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.admin_members enable row level security;
alter table public.coach_profiles enable row level security;
alter table public.coach_assignments enable row level security;
alter table public.exercise_content enable row level security;
alter table public.coach_messages enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.billing_events enable row level security;

drop policy if exists "Authenticated users read plans" on public.plans;
create policy "Authenticated users read plans" on public.plans for select to authenticated using (active or private.is_admin());
drop policy if exists "Public read active plans" on public.plans;
create policy "Public read active plans" on public.plans for select to anon using (active);
drop policy if exists "Admins manage plans" on public.plans;
create policy "Admins manage plans" on public.plans for all to authenticated using (private.is_admin()) with check (private.is_admin());

drop policy if exists "Users read own subscription" on public.subscriptions;
create policy "Users read own subscription" on public.subscriptions for select to authenticated using (user_id = auth.uid() or private.is_admin());
drop policy if exists "Admins manage subscriptions" on public.subscriptions;
create policy "Admins manage subscriptions" on public.subscriptions for all to authenticated using (private.is_admin()) with check (private.is_admin());
drop policy if exists "Members choose test subscription" on public.subscriptions;
create policy "Members choose test subscription" on public.subscriptions for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and plan_code in ('free', 'plus', 'pro')
  and status = 'active'
  and provider = 'manual'
  and current_period_end is null
  and cancel_at_period_end = false
);

drop policy if exists "Staff read own role" on public.admin_members;
create policy "Staff read own role" on public.admin_members for select to authenticated using (user_id = auth.uid());

drop policy if exists "Members read assigned coach" on public.coach_profiles;
create policy "Members read assigned coach" on public.coach_profiles for select to authenticated using (
  user_id = auth.uid() or private.is_admin() or exists (
    select 1 from public.coach_assignments a where a.coach_id = id and a.member_user_id = auth.uid() and a.status = 'active'
  )
);
drop policy if exists "Admins manage coaches" on public.coach_profiles;
create policy "Admins manage coaches" on public.coach_profiles for all to authenticated using (private.is_admin()) with check (private.is_admin());

drop policy if exists "Participants read assignments" on public.coach_assignments;
create policy "Participants read assignments" on public.coach_assignments for select to authenticated using (
  member_user_id = auth.uid() or coach_id = private.current_coach_id() or private.is_admin()
);
drop policy if exists "Admins manage assignments" on public.coach_assignments;
create policy "Admins manage assignments" on public.coach_assignments for all to authenticated using (private.is_admin()) with check (private.is_admin());

drop policy if exists "Authenticated users read exercises" on public.exercise_content;
create policy "Authenticated users read exercises" on public.exercise_content for select to authenticated using (published or private.is_admin());
drop policy if exists "Admins manage exercises" on public.exercise_content;
create policy "Admins manage exercises" on public.exercise_content for all to authenticated using (private.is_admin()) with check (private.is_admin());

drop policy if exists "Participants read messages" on public.coach_messages;
create policy "Participants read messages" on public.coach_messages for select to authenticated using (
  private.is_admin() or exists (
    select 1 from public.coach_assignments a
    where a.id = assignment_id and a.status = 'active'
      and (a.member_user_id = auth.uid() or a.coach_id = private.current_coach_id())
  )
);
drop policy if exists "Participants send messages" on public.coach_messages;
create policy "Participants send messages" on public.coach_messages for insert to authenticated with check (
  sender_id = auth.uid() and exists (
    select 1 from public.coach_assignments a
    where a.id = assignment_id and a.status = 'active'
      and (a.member_user_id = auth.uid() or a.coach_id = private.current_coach_id())
  )
);

drop policy if exists "Participants read conversations" on public.conversations;
create policy "Participants read conversations" on public.conversations for select to authenticated using (
  member_user_id = auth.uid() or coach_id = private.current_coach_id() or private.is_admin()
);
drop policy if exists "Admins manage conversations" on public.conversations;
create policy "Admins manage conversations" on public.conversations for all to authenticated using (private.is_admin()) with check (private.is_admin());
drop policy if exists "Participants read conversation messages" on public.messages;
create policy "Participants read conversation messages" on public.messages for select to authenticated using (
  exists (select 1 from public.conversations c where c.id = conversation_id and (c.member_user_id = auth.uid() or c.coach_id = private.current_coach_id() or private.is_admin()))
);
drop policy if exists "Participants send conversation messages" on public.messages;
create policy "Participants send conversation messages" on public.messages for insert to authenticated with check (
  sender_user_id = auth.uid() and exists (select 1 from public.conversations c where c.id = conversation_id and (c.member_user_id = auth.uid() or c.coach_id = private.current_coach_id() or private.is_admin()))
);

drop policy if exists "Free members read active ads" on public.ad_campaigns;
create policy "Free members read active ads" on public.ad_campaigns for select to authenticated using (
  status = 'active' and exists (
    select 1 from public.subscriptions s where s.user_id = auth.uid() and s.plan_code = 'free' and s.status = 'active'
  ) or private.is_admin()
);
drop policy if exists "Admins manage ads" on public.ad_campaigns;
create policy "Admins manage ads" on public.ad_campaigns for all to authenticated using (private.is_admin()) with check (private.is_admin());
drop policy if exists "Admins read billing" on public.billing_events;
create policy "Admins read billing" on public.billing_events for select to authenticated using (private.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('exercise-videos', 'exercise-videos', true, 524288000, array['video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins upload exercise videos" on storage.objects;
create policy "Admins upload exercise videos" on storage.objects for insert to authenticated
with check (bucket_id = 'exercise-videos' and private.is_admin());
drop policy if exists "Admins update exercise videos" on storage.objects;
create policy "Admins update exercise videos" on storage.objects for update to authenticated
using (bucket_id = 'exercise-videos' and private.is_admin()) with check (bucket_id = 'exercise-videos' and private.is_admin());
drop policy if exists "Admins delete exercise videos" on storage.objects;
create policy "Admins delete exercise videos" on storage.objects for delete to authenticated
using (bucket_id = 'exercise-videos' and private.is_admin());

grant select on public.plans, public.subscriptions, public.coach_profiles, public.coach_assignments, public.exercise_content, public.coach_messages, public.ad_campaigns to authenticated;
grant select on public.plans to anon;
grant insert on public.coach_messages to authenticated;
grant select on public.conversations, public.messages to authenticated;
grant insert on public.messages to authenticated;
grant select, insert, update, delete on public.plans, public.coach_profiles, public.coach_assignments, public.exercise_content, public.ad_campaigns to authenticated;
revoke insert, delete on public.subscriptions from authenticated;
revoke update on public.subscriptions from authenticated;
grant update (plan_code, status, provider, current_period_end, cancel_at_period_end, updated_at) on public.subscriptions to authenticated;
