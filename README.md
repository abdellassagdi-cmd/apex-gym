# Apex Gym

Apex Gym is an Expo/React Native fitness app with a Supabase backend and a separate React admin dashboard.

## Product access

- **Free:** full exercise catalog with GIF guides and ads.
- **Plus:** removes ads and unlocks exercise videos.
- **Pro:** includes Plus access, coach assignment, and direct coach messaging.

## Applications

- Mobile/web app: Expo SDK 56 in the repository root.
- Admin dashboard: Vite/React in `admin-dashboard/`.
- Backend: Supabase Auth, Postgres, Storage, and RLS policies.

## Local development

Create `.env` from `.env.example`, then run:

```bash
npm install
npm start
```

For the admin dashboard:

```bash
cd admin-dashboard
npm install
npm run dev
```

Database setup and migrations are documented in `docs/`.

## Security

Never commit `.env`, service-role/secret keys, signing credentials, or production APK files. The frontend uses only Supabase publishable keys and relies on Row Level Security for data access.
