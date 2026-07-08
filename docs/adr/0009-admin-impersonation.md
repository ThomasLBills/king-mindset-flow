# ADR 0009: Admin User Impersonation via Session Swap

Date: 2026-07-08
Status: Accepted

## Context

Support and QA admins repeatedly need to see the app *exactly* as a specific
member sees it: to reproduce reported bugs, verify entitlement state, walk a
user through a flow, and QA new features. Asking members for their passwords
is unacceptable, and screen-share is slow.

We need a first-class "view as user" capability with:
- Strong access control (admins only, never against other admins)
- Full audit trail
- Zero risk of accidentally acting as the target
- Trivial "exit" flow

## Decision

### 1. Session-swap on the client
When an admin starts impersonation, the app:
1. Saves the admin's current Supabase session (`access_token` + `refresh_token`)
   to `localStorage["lk_admin_pre_impersonation"]`.
2. Calls the `admin-impersonate` edge function, which mints a real Supabase
   session for the target user.
3. Loads the returned tokens with `supabase.auth.setSession(...)`.
4. Marks impersonation active with `localStorage["lk_impersonation_meta"]`.

On exit, the client restores the saved admin session via `setSession()` and
removes the meta key.

Advantages:
- Every existing hook/query keeps working with no refactor — they all read
  from the single shared Supabase client, which now points at the target.
- RLS is enforced against the target user (as intended — this is the whole
  point). No custom claim handling needed.
- Exit is instant, no re-login.

### 2. Real Supabase JWT for the target (not a custom-signed impersonation token)
The edge function uses `auth.admin.generateLink({ type: 'magiclink', email })`
plus `verifyOtp({ type: 'magiclink', token_hash })` on a service-role client
to obtain a *real* short-lived session for the target. This means:
- No custom JWT signing / secret handling.
- Standard Supabase auth machinery (refresh, expiry, revocation) applies.
- Zero coupling to Supabase's internal JWT signing keys.

### 3. UI safety rails
- **Persistent banner** on every route (`bg-destructive`) showing the target
  name, email, and remaining time, with an Exit button.
- **Admin routes are blocked while impersonating** — visiting `/admin*` while
  a session is active redirects to `/app` with a toast. Admins must exit first
  to take admin actions. This is the primary structural protection against
  admins accidentally modifying data as the target.
- **Destructive user-facing actions are disabled** via `useIsImpersonating()`:
  Manage Billing, Delete Account, chat send, declaration create.

### 4. Audit trail
All start/stop events are written to `admin_audit_log` with
`action = 'impersonation_start' | 'impersonation_stop'`,
`admin_user_id = <real admin>`, and `entity_id = <target user>`.

### 5. Session lifetime
- Access token: standard Supabase lifetime (1 hour). The client does **not**
  refresh impersonation tokens — when they expire, the client automatically
  exits impersonation and restores the admin session.

## Alternatives Considered

**Dual concurrent Supabase clients** (one admin, one target). Rejected: forces
a wide refactor of every data-reading component to route through a new
`useAppSupabase()` hook, and creates two Realtime connections with duplicate
subscriptions.

**Custom signed JWT with `impersonated_by` claim** validated by every edge
function. Rejected for v1 due to complexity of signing-key access, key
rotation, and having to teach every existing edge function to inspect claims.
Kept as a future upgrade path if server-side backstops become necessary.

**Backend proxy** rewriting user_id on every query. Rejected: massive surface
area, fragile, defeats the purpose of RLS.

## Consequences

Positive:
- Admins can debug user-reported issues quickly.
- Implementation is small and localized.
- Standard RLS applies — no bespoke authorization code.

Negative / accepted trade-offs:
- Server-side edge functions cannot currently distinguish "the user acting"
  from "an admin impersonating that user". Protection relies on UI disabling
  destructive actions. If an admin bypasses the UI (e.g. hits the edge
  function directly), those actions would execute as the target. This is
  acceptable for v1 because (a) admins are trusted, (b) every session is
  audited, and (c) the admin route lockout prevents the most likely footgun.
- Impersonation tokens live in `localStorage` alongside the admin's own
  session data. Mitigated by 1-hour expiry and the fact that XSS on the admin
  device already compromises everything.

## Follow-ups (out of scope for v1)
- Server-side backstop via custom JWT claim on billing/account-mutation
  endpoints.
- Dedicated `/admin/audit-log` view filtered to impersonation events.
- Automatic Realtime channel resubscription on session swap.