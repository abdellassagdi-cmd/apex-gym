# Apex Gym — account migration handoff

Updated: 2026-06-22 after migration to the new accounts

This file preserves the deployment state while the owner changes the Gmail/accounts connected to Codex. Do not copy old private credentials into this file.

## Local source of truth

- Workspace: `C:\Users\oulba\OneDrive\Bureau\gym app`
- Mobile app: Expo SDK 56 / React Native
- Admin dashboard: `admin-dashboard/` (Vite/React)
- The working tree currently contains many uncommitted and untracked project files. Preserve all of them.
- No Git remote is currently configured in this workspace.

## Implemented product behavior

- Signup includes Free, Plus, and Pro plan selection without a payment gateway for testing.
- The selected plan is stored in the real Supabase subscription data.
- Free: ads, all exercises, GIF guidance.
- Plus: no ads and exercise videos.
- Pro: Plus access plus personal coach assignment workflow.
- Admin dashboard uses real Supabase data; demo/preview dashboard data was removed.
- Admin supports members, member details/intake answers, subscriptions, coach requests/assignments, coaches, exercises, programs, messages, ads, and payments surfaces.
- Exercises/programs include athlete-level targeting.
- Exercise edits are keyed by stable exercise keys so app content can receive admin updates.
- Coach/member RLS recursion was fixed with private security-definer helper functions.
- Google OAuth is configured in Supabase and the app's Google login redirect was verified against `accounts.google.com` on 2026-06-22.

## Supabase current state

- Current project ref: `tqnbktamgsynhqxytkpw`
- Current URL: `https://tqnbktamgsynhqxytkpw.supabase.co`
- Current account email: `abdellassagdi@gmail.com`
- Schema and all local migrations were applied on 2026-06-22.
- Owner allowlist now uses `abdellassagdi@gmail.com`.
- Relevant SQL/migrations are in `docs/`:
  - `supabase-schema.sql`
  - `test-plan-selection-migration.sql`
  - `coach-rls-recursion-fix.sql`
  - `catalog-level-targeting-migration.sql`
  - `member-profile-access-migration.sql`
  - `supabase-membership-video-migration.sql`
- When a new Supabase account/project is connected: apply/verify the schema and migrations, update local Expo env values, update `eas.json`, update admin env values, and test RLS as member/admin/coach.

## Netlify current state

- Current site name: `apex-gym-admin-abdell`
- Current site ID: `0bf5458b-b08d-4836-8a11-d2762107757e`
- Current production URL: `https://apex-gym-admin-abdell.netlify.app`
- Netlify account email: `abdellassagdi@gmail.com`
- Production deploy completed on 2026-06-22.
- Root `netlify.toml` builds `admin-dashboard` and includes SPA redirects/security headers.
- When the new Netlify account is connected: create or link the target site, set the two Supabase public build environment variables, build the dashboard, deploy production, and verify the URL/status.

## Expo / Android state

- Previous EAS owner: `assagdi.abdell`
- EAS project ID: `98618466-8fcc-49fe-be6d-b198e35daba0`
- Android package: `com.assagdi.apexgym`
- Latest completed preview APK build ID: `798a3799-91bc-4a14-9c89-c863e0d93dc7`
- Local APK: `Apex-Gym-Android-2026-06-21.apk`
- If Expo ownership changes, create/link the new EAS project and update `expo.owner` and `extra.eas.projectId` before building another APK.

## GitHub migration checklist

- Connected GitHub login: `abdellassagdi-cmd`.
- Current repository: `https://github.com/abdellassagdi-cmd/apex-gym`.
- Review `.gitignore`, commit the complete source intentionally, push, and verify the remote contents.

## Trigger phrase

When the user says the new Supabase, GitHub, and Netlify accounts are connected, continue from this file and perform the migration/deployment checks above. Do not overwrite the local source with an older remote copy.
