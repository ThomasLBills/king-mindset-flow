# ADR 0003 — Gate paid features by `entitlements`, not Stripe subscription state

- **Status:** Accepted
- **Date:** 2026-02-05

## Context
The app has multiple ways a user can gain access to paid content:
- 60-day free trial granted at signup.
- Paid Stripe subscription (monthly / annual).
- Admin/Zapier manual grant.
- Grace period after a failed payment.

If the UI reads Stripe subscription state directly, every screen has to reason about trials, grants, and payment failures. Worse, Stripe state is only reliably known after a webhook lands.

## Decision
Introduce a `public.entitlements(user_id, entitlement_type, active, source, expires_at)` table as the **single source of truth** for access. All feature gates check `public.has_active_entitlement(auth.uid(), 'course_app_access')`, which returns true when there is an active row whose `expires_at` is null or in the future.

Writers of entitlements:
- `handle_new_user` trigger inserts a 60-day trial row at signup.
- Stripe webhook (`verify_jwt=false`) upserts entitlements on subscription lifecycle events.
- `zapier-provision-user` inserts a trial row for externally provisioned users.
- `deactivate_expired_entitlements` (scheduled) flips `active=false` for rows past `expires_at`.

The Supabase session is refreshed before the entitlement gate to avoid stale-JWT paywall loops.

## Alternatives considered
- **Query Stripe on every request.** Rejected: latency, rate limits, brittle offline behavior.
- **Denormalize onto `profiles.is_paid`.** Rejected: no expiry semantics, no source-of-grant traceability, hard to model multiple entitlement types.
- **Client-side flag from localStorage.** Rejected: trivially bypassable.

## Consequences
**Positive**
- One `has_active_entitlement` call covers trials, subs, and grants.
- New entitlement types (e.g. `coach_seat`) are additive.
- Timezone-neutral: comparisons are UTC absolute.

**Negative**
- Requires the webhook to be reliable; a missed webhook leaves the entitlement stale until the scheduled deactivator runs.
- Adds a small SECURITY DEFINER function to the surface area.

**Neutral**
- Frontend must refresh the session before checking entitlements, otherwise a paywall loop can appear after upgrade.

## References
- Migrations creating `entitlements` and `has_active_entitlement`.
- `supabase/functions/stripe-webhook`
- Memory: `mem://features/subscription-system`, `mem://architecture/subscription-logic-resilience`