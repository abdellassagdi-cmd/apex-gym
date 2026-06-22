# Supabase Setup

Use this when you are ready to turn Apex Gym from local preview mode into account mode.

## 1. Create The Project

Create a Supabase project from the dashboard. The connector currently shows your organization, but no project yet.

## 2. Run The Schema

Open the Supabase SQL Editor and run:

```sql
-- docs/supabase-schema.sql
```

Then run the current membership and video migration:

```sql
-- docs/supabase-membership-video-migration.sql
```

That file creates:

- `profiles`
- `user_settings`
- `workout_sessions`

The full schema uses Row Level Security for member data, paid video access, admin operations, coach assignments, and private coaching messages.

## 3. Add App Environment Variables

Copy `.env.example` to `.env` and fill:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
```

For this project:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://tqnbktamgsynhqxytkpw.supabase.co
```

Use the publishable key for the app. Never put a service role key in Expo.

## 4. Enable Email Login

In Supabase Auth settings, keep Email provider enabled. Users can create accounts with email and password.

## 5. Enable Google Login

In Supabase Auth providers, enable Google after creating OAuth credentials in Google Cloud.

Add these redirect URLs in Supabase:

```text
apexgym://auth/callback
http://localhost:8081/auth/callback
```

For production web preview later, add the production website callback too.

## 6. Restart The App

After changing `.env`, restart Expo/export so the public env vars are inlined.

When env vars are present, Apex Gym requires login. Without env vars, it stays in local preview mode.
