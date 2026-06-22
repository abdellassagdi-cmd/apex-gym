# Apex Gym payments setup

## Recommended stack

- Google Play Billing collects Android subscription payments.
- RevenueCat connects the app to Google Play, validates purchases, and tracks renewals/cancellations.
- Supabase receives RevenueCat webhook events and updates `subscriptions`.
- The app only reads the resulting entitlement: `free`, `plus`, or `pro`.

Do not collect card numbers directly in the Expo app and do not mark a user as paid from the client.

## Accounts and information needed

1. A verified Google Play Console developer account.
2. A Google Payments merchant profile with legal name, address, identity/business and bank details.
3. A RevenueCat account and project.
4. The final Android package ID from `app.json`.
5. Final monthly/yearly prices and supported countries for Plus and Pro.
6. A privacy policy, terms, support email, and subscription/cancellation copy.
7. An EAS development build. Real in-app purchases cannot be tested in ordinary Expo Go.

## Products to create

Create two subscriptions in Google Play Console:

- `apex_plus`: monthly and yearly base plans.
- `apex_pro`: monthly and yearly base plans.

Use the same identifiers in RevenueCat, then map them to entitlements:

- `plus` entitlement -> Plus products.
- `pro` entitlement -> Pro products.

## Purchase flow

1. Member taps Plus or Pro in the app.
2. Google Play displays and completes the payment sheet.
3. RevenueCat validates the purchase with Google.
4. RevenueCat sends a signed webhook event to the backend.
5. The backend upserts the member's `subscriptions` row.
6. Plus unlocks videos and removes ads.
7. Pro also enters the admin's “waiting for coach” queue.
8. Admin chooses a coach; the member and coach conversation is created.

## Events the webhook must handle

- Initial purchase
- Renewal
- Product change (Plus to Pro or Pro to Plus)
- Cancellation
- Expiration
- Billing issue
- Refund/revocation

Store each provider event in `billing_events` before processing it so repeated webhooks stay idempotent and auditable.

## Testing order

1. Configure Play Console license testers.
2. Install an EAS development build from the Play internal testing track.
3. Test Plus purchase, restore, renewal and cancellation.
4. Test Pro purchase and confirm the member appears in the coach assignment queue.
5. Assign a coach and verify chat access on both accounts.
6. Only then enable production products.

## Production secrets

Keep RevenueCat webhook secrets and any server credentials in Supabase/Netlify server-side environment variables. Only public RevenueCat SDK keys and Supabase publishable keys may be present in the app.
