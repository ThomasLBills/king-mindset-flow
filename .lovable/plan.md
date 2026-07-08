# PRD: Admin User Impersonation

## 1. Overview
Allow platform admins to temporarily "view as" any user account so they can reproduce bugs, verify entitlement/paywall state, walk a member through their app, and QA new features without asking the member for their password.

Impersonation is **view + limited-action** access to the app under another user's identity, with a persistent, unmissable banner and a full audit trail. It never exposes the target's password, and it is not a permission escalation for the target.

## 2. Goals
- Admins can start an impersonation session for any non-admin user from `/admin/users`.
- The app reliably renders as that user (auth session, entitlements, RLS reads, UI personalization).
- Every impersonation start, stop, and destructive action is written to `admin_audit_log`.
- Admins can end impersonation from anywhere in the app in one click.
- Zero risk of an admin forgetting they are impersonating (persistent banner + route guards).

## 3. Non-Goals
- Impersonating another admin (blocked).
- Impersonation from unauthenticated context.
- "Silent" mode with no banner.
- Long-lived tokens (max 60 min, then must re-elevate).
- Performing password changes, email changes, deleting the target's account, or purchasing on their behalf while impersonating.

## 4. Users & Permissions
- Only `user_roles.role = 'admin'` can start impersonation.
- Verified server-side on every impersonation request; client role check is UX-only.
- Target user must not have the `admin` role.

## 5. User Stories
1. As an admin, I open `/admin/users`, click "View as" on a user row, confirm the intent modal, and the app reloads into that user's Home screen with a red top banner reading "Viewing as {name} — Exit".
2. As an admin impersonating, I can navigate Home, Armor, Brothers, Path, Billing, and admin-visible progress screens exactly as the user sees them.
3. As an admin impersonating, if I try to perform a blocked action (delete account, change password, open Stripe portal, send a chat message, post a declaration), I get a toast: "Action disabled while impersonating."
4. As an admin, I click "Exit" in the banner and am returned to `/admin/users` as myself, session fully restored.
5. As a compliance reviewer, I can query `admin_audit_log` to see every impersonation session (who, whom, when, duration, IP-hash).

## 6. UX

### 6.1 Entry point
- On `/admin/users`, add a "View as" action in each row's action menu (icon: `UserRoundCog`).
- Clicking opens a confirmation dialog:
  - Title: "View as {display_name}"
  - Body: "You will see the app exactly as this member sees it. All actions are read-only or logged. Session ends automatically after 60 minutes."
  - Buttons: Cancel / Start session.

### 6.2 Global banner
- Fixed top banner, `bg-destructive text-destructive-foreground`, 40px tall, above every route.
- Content: "Viewing as {first_name} ({email}) • {remaining_time_mm:ss}   [Exit]"
- Present on every route including admin routes. Route guard: admin routes require impersonation OFF (so admins don't accidentally alter data as the target).

### 6.3 Blocked-action affordances
- Buttons for destructive/financial actions render disabled with a tooltip: "Disabled during impersonation."
- Chat composer, declaration create, Manage Billing, Delete Account, password/email forms are all disabled.

### 6.4 Exit
- Banner Exit button + `Esc` shortcut.
- After exit: toast "Exited impersonation of {name}", route pushed to `/admin/users`.

## 7. Technical Design (for engineering)

### 7.1 Auth strategy — signed impersonation JWT via edge function
We do **not** rotate the admin's Supabase auth session on the client. Instead, the frontend maintains two concurrent sessions:

1. **Admin session** (always the real logged-in admin, stored in the normal Supabase localStorage key).
2. **Impersonation session** (short-lived, stored in a separate localStorage key, used to construct a *second* Supabase client used by all app data reads/writes while impersonating).

This keeps "Exit" instant and safe (no re-login), and lets the audit trail always attribute the requesting identity to the real admin.

### 7.2 Edge function: `admin-impersonate`
- `POST /admin-impersonate` `{ target_user_id }`
  - Verify caller JWT → `admin` role.
  - Reject if target has `admin` role or does not exist.
  - Use service role client to call `auth.admin.generateLink({ type: 'magiclink', email: target.email })` OR issue a `signInWithIdToken` — preferred approach: use `supabase.auth.admin.createUser`-style flow is wrong; use `supabase.auth.admin.generateLink` to mint a 60-min access token, or issue a custom JWT signed with `SUPABASE_JWT_SECRET` scoped to the target user with a custom claim `impersonated_by = <admin_uuid>` and `exp = now + 60m`.
  - Write `admin_audit_log` row: `{ action: 'impersonation_start', actor_id, target_id, before_json: null, after_json: { session_id, expires_at } }`.
  - Return `{ access_token, refresh_token, expires_at, target_profile }`.
- `POST /admin-impersonate/stop` `{ session_id }`
  - Writes `impersonation_stop` audit row with duration.

### 7.3 Impersonation context (client)
- New React context `ImpersonationProvider` wrapping `<App />`.
- Holds `{ impersonatedClient, targetProfile, expiresAt, endImpersonation }`.
- All existing `supabase` imports continue to point to the admin client. Introduce a `useAppSupabase()` hook that returns `impersonatedClient ?? supabase` — swap call sites in feature code (Home, Armor, Brothers, Path, Billing, Profile) to use the hook. Admin screens keep using the raw `supabase` import.
- Auto-logout of impersonation on `expiresAt`.

### 7.4 Blocked actions
Central helper `isImpersonating()`. Wrap sensitive mutations:
- Chat send (`MessageComposer`)
- Declaration create/delete
- Profile edit (name, avatar, password, email)
- Delete account
- `create-billing-portal`, `create-checkout-session` invocations
- Any admin route → redirect to `/admin` with toast "Exit impersonation first."

Server-side backstop: edge functions that require the real user (billing, delete account, password reset) reject JWTs containing the `impersonated_by` claim.

### 7.5 Database
Reuse existing `admin_audit_log` (no schema change). Add action values: `impersonation_start`, `impersonation_stop`. No new table required.

### 7.6 Security
- Only admins can call `admin-impersonate` (JWT + role check).
- Cannot impersonate admins (server enforced).
- Impersonation JWTs carry `impersonated_by` claim; downstream edge functions inspect it and refuse destructive ops.
- Max session 60 min, no refresh.
- All start/stop events audited with actor, target, timestamps, and (hashed) IP + user agent.
- Rate limit: max 20 impersonation starts per admin per hour (via `edge_rate_limits`).

## 8. Analytics / Audit
- Query surface: `SELECT * FROM admin_audit_log WHERE action LIKE 'impersonation_%' ORDER BY created_at DESC`.
- Optional future: dedicated `/admin/audit` view (out of scope for v1).

## 9. Rollout
- Ship behind `admin` role gate only — no feature flag needed.
- Announce to admin team via internal doc.

## 10. Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Admin forgets they're impersonating and messages a member as them | Chat composer disabled; persistent red banner; timeout |
| Admin abuses feature | Full audit log; rate-limited; only admins allowed |
| Token leakage | Short-lived (60m); separate storage key; not sent to third parties |
| RLS bypass surprises | Impersonation uses a real user JWT — RLS still applies as the target |
| Billing action performed as target | Edge functions reject `impersonated_by` JWTs |

## 11. Success Metrics
- Time-to-repro user-reported bugs decreases (qualitative).
- Zero incidents of destructive admin actions performed while impersonating (audit review).
- 100% of impersonation sessions have matching start/stop audit rows.

---

# Implementation Plan (v1)

1. **ADR** — add `docs/adr/0009-admin-impersonation.md` documenting the dual-session approach and `impersonated_by` JWT claim.
2. **Edge function** `supabase/functions/admin-impersonate/index.ts`
   - Actions: `start`, `stop`.
   - Uses `SUPABASE_JWT_SECRET` (add secret if missing) to mint a scoped access token, OR uses `supabase.auth.admin.generateLink` to obtain a real session for the target.
   - Writes to `admin_audit_log`.
   - Rate-limited via `bump_rate_limit`.
3. **Client context** `src/contexts/ImpersonationContext.tsx`
   - `useImpersonation()`, `useAppSupabase()`, `useIsImpersonating()`.
   - Persists impersonation session in `lk_impersonation_v1` localStorage key.
   - Auto-expiry timer.
4. **Global banner** `src/components/impersonation/ImpersonationBanner.tsx`
   - Mounted in root layout above router outlet.
5. **Admin UI**
   - `/admin/users`: add "View as" menu action + confirmation dialog.
6. **Guarded actions**
   - Swap `supabase` → `useAppSupabase()` in: `src/pages/Home*`, `Armor*`, `Brotherhood*`, `Path*`, `Billing.tsx`, `Profile*`, chat feature.
   - Add `useIsImpersonating()` gate on: chat send, declarations CRUD, profile mutations, billing portal, delete account, admin routes.
7. **Server backstops**
   - `create-billing-portal`, `create-checkout-session`, `delete-account` (and any password/email edge functions): reject JWTs whose payload includes `impersonated_by`.
8. **Docs** — update `README.md` admin section with a short "How to impersonate" note.

Out of scope for v1: dedicated audit viewer UI, mobile push-notification suppression during impersonation, screen-recording, cross-device session sync.
