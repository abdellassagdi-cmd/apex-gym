# Apex Admin And Billing

## Plans

- `Free`
  - Full exercise library with GIF demonstrations
  - Ads enabled
  - No owner-recorded exercise videos
  - No coach chat
- `Plus`
  - Full exercise library
  - No ads
  - Owner-recorded exercise videos
  - No coach chat
- `Pro`
  - Everything in Plus
  - Coach assignment and coach chat
  - Priority support

## Database Model

- `plans`
  - Source of truth for pricing and entitlements
- `subscriptions`
  - Current user plan, provider, and status
- `coach_profiles`
  - Internal coach roster and capacity
- `coach_assignments`
  - Maps Pro members to coaches
- `ad_campaigns`
  - Free-plan monetization units
- `billing_events`
  - External provider events stored for audit and sync
- `admin_members`
  - Admin dashboard access control

## Recommended Payment Stack

- Android app subscriptions:
  - `Google Play Billing` for store products
  - `RevenueCat` for entitlement sync, renewals, cancellations, and a simpler client SDK
- Web payments later:
  - `Stripe Billing + Checkout Sessions`
  - Good for selling subscriptions on web, not required for Android-first launch

## Public Launch Flow

1. Create `Plus` and `Pro` subscription products in Google Play Console.
2. Mirror those products inside RevenueCat.
3. Connect RevenueCat webhook to backend logic that updates `subscriptions`.
4. Mobile app reads the resulting entitlement flags and gates:
   - GIF versus video demonstration access
   - ad visibility
   - coach chat access
5. Admin dashboard manages pricing copy, coach capacity, ad drafts, and member overrides.

## Coach Workflow

1. User upgrades to `Pro`.
2. Subscription becomes active in `subscriptions`.
3. Admin assigns a coach in `coach_assignments`.
4. Mobile app shows coach chat only when:
   - plan is `pro`
   - subscription is active
   - a coach assignment exists

## Ads Workflow

1. Admin creates campaigns in `ad_campaigns`.
2. Mobile app requests campaigns only for users whose plan has `show_ads = true`.
3. Plus and Pro should ignore ad placements completely.

## Admin Access

- Owner email allowlisted now:
  - `oulbachir2019@gmail.com`
- After that email signs up in Supabase Auth, the trigger inserts owner access in `admin_members`.
- Only active admin members should open the dashboard.

## What Still Needs Real Provider Setup

- Google Play Console products
- RevenueCat project and API keys
- Webhook endpoint for subscription sync
- Optional Stripe web billing later
