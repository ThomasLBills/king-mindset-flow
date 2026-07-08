# Remediation Task List — Ordered Fix Plan

We will work through these one at a time. After you approve this task list, tell me "start task 1" (or any task number) and I'll implement only that task, verify it, and stop for your review before moving on.

**Ground rules for every task:**
- One task per turn. No batching unless you say so.
- Every task ends with a verification step (query, curl, or browser check) before I claim it's done.
- If a task risks breaking legitimate users (e.g. flipping the storage bucket, tightening RLS), I'll list what to test first and pause for your go-ahead before shipping.
- Nothing gets deleted from the DB without you confirming the destructive step.

---

## TASK 1 — Remove plaintext temporary passwords from the database  `[P0 · Critical]`

**Why first:** every hour this exists, the blast radius grows. A single leak = every affected user compromised. This is the only issue on the list where the fix retroactively protects existing users.

**How we fix it:**
1. Audit every code path that writes `profiles.temp_password`: `zapier-provision-user`, `admin-create-user`, Stripe `resolveUserId` invite flow, `auth-email-hook`, `send-verification-code`, `verify-code-set-password`.
2. Change each write site so the generated password is passed to the email edge function **in the same request** and never persisted. The verification-code flow already handles first-login without a persisted password — we extend it as the single provisioning path.
3. Update `ForgotPassword` / `SetupAccount` UI so "resend password" issues a *new* single-use code instead of re-reading the stored value.
4. Migration: `UPDATE profiles SET temp_password = NULL` for every row, then `ALTER TABLE profiles DROP COLUMN temp_password`.
5. Grep function logs and `admin_audit_log` for any leaked plaintext values and scrub.

**Verification:** `SELECT count(*) FROM profiles WHERE temp_password IS NOT NULL` → 0 (before drop). Column absent after drop. New user provisioned via Zapier receives working setup email; no row ever contains a plaintext password. Admin "resend credentials" flow still works via new-code path.

**Risk:** users mid-onboarding who never used their temp password will need to request a new setup code. Support should be briefed.

---

## TASK 2 — Split `profiles` RLS so users can't read each other's PII  `[P0 · Critical]`

**Why second:** this is the surface that made Task 1 catastrophic. Even after temp_password is gone, email/phone leakage is a reportable event.

**How we fix it:**
1. Read the current `profiles` policies via `pg_policies` to see exactly what's permissive today.
2. Replace with three narrow policies:
   - **Self-read**: `USING (user_id = auth.uid())` — returns full row.
   - **Admin-read**: `USING (public.has_role(auth.uid(),'admin'))` — full row.
   - **Directory-read**: create a `public.public_profiles` VIEW exposing only `user_id, display_name, first_name, avatar_url`. Grant `SELECT` on the view to `authenticated`. No RLS SELECT policy on the base table for other users.
3. Update Brotherhood search / My Brothers / channel member list to query `public_profiles` instead of `profiles`.
4. Update admin surfaces that need the full row — they already use `has_role`, so no change.

**Verification:** As user A, `SELECT * FROM profiles` returns exactly 1 row. `SELECT * FROM public_profiles` returns many rows but only whitelisted columns. As admin, `SELECT * FROM profiles` returns all rows. Brotherhood UI still shows brothers.

**Risk:** any component doing `select('*')` from `profiles` for another user will silently return empty. I'll grep the client for these before shipping.

---

## TASK 3 — Remove dev auth bypass from production bundles  `[P0 · High]`

**Why third:** it's a landmine that could nullify every other control on this list.

**How we fix it:**
1. Replace the runtime `isDevBypassEnabled()` check with a build-time constant. Define `__DEV_BYPASS__` in `vite.config.ts` as `mode === 'development' && env.VITE_DEV_BYPASS_AUTH === 'true'`.
2. Refactor `AuthGuard`, `AdminGuard`, `EntitlementGuard` to `if (__DEV_BYPASS__) { ... }`. Vite will tree-shake the bypass branch out of production builds entirely.
3. Delete `DevBypassBanner` and `devBypass.ts` imports from any prod code path.
4. Add a `vite.config.ts` assertion: if `mode === 'production' && env.VITE_DEV_BYPASS_AUTH === 'true'`, throw and fail the build.
5. Confirm `.env.development` is never bundled into `dist/`.

**Verification:** `bun run build`, then `grep -r "isDevBypass\|DevBypassBanner" dist/` → no matches. Set the env var to true, rebuild in prod mode → build fails. Rebuild in dev mode → bypass works locally.

**Risk:** none for production. Local devs keep the bypass.

---

## TASK 4 — Lock down the `curriculum-files` storage bucket  `[P0 · Critical]`

**Why fourth:** revenue-defining. Currently every paid video is a public download.

**How we fix it:**
1. Inventory: list every public URL currently in use (`select storage.objects` where bucket = 'curriculum-files'; grep the codebase and email templates for hardcoded public URLs).
2. Add a `get-lesson-asset-url` edge function that: verifies JWT → checks `has_active_entitlement(auth.uid()) OR has_role(auth.uid(),'admin')` → returns a signed URL (10-minute TTL) via `supabase.storage.from('curriculum-files').createSignedUrl(path, 600)`.
3. Update `LessonView` and any curriculum viewer to call this function instead of using public URLs directly.
4. Update `curriculum-files` bucket to `public = false` via `storage_update_bucket`.
5. Add storage RLS policy on `storage.objects` for that bucket restricting `SELECT` to entitled users + admin (belt and suspenders with signed URLs).
6. Deny `LIST` for `anon`.

**Verification:** Unauthenticated `GET` on a known object URL → 400. Authenticated-but-unentitled → edge function returns 403. Entitled → 200 and video plays. Admin curriculum editor still works.

**Risk:** any hardcoded public URL in emails, marketing pages, or lesson bodies breaks. I'll enumerate before flipping.

**Dependencies:** must ship together with Task 5.

---

## TASK 5 — Enforce entitlement in RLS on curriculum data tables  `[P0 · Critical]`

**Why fifth:** files are locked (Task 4) but the row data (lesson text, module structure, video URLs stored as columns) is still readable via `/rest/v1/*`. Same revenue leak, different layer.

**How we fix it:**
1. Read current RLS on `courses`, `modules`, `weeks`, `lessons`, `lesson_resources`, `curriculum_lessons` (and `curriculum_versions`, `programs`).
2. Rewrite `SELECT` policies:
   - **Entitled + published**: `USING (published = true AND (public.has_active_entitlement(auth.uid()) OR public.has_role(auth.uid(),'admin')))`
   - **Admin-any**: `USING (public.has_role(auth.uid(),'admin'))` — covers drafts.
3. Confirm/adjust `authenticated` GRANTs; revoke `anon` where it's not needed.
4. Handle preview/free-lesson exceptions explicitly if any exist today (I'll surface them before writing the policies).

**Verification:** three test accounts (no entitlement, active trial, expired). Direct Data API SELECT on each table returns rows only for entitled + admin. Client Path / Library screens still load for entitled users. Admin curriculum editor still shows drafts.

**Risk:** breaks any surface currently relying on permissive read (e.g. marketing preview). Must audit first.

---

## TASK 6 — Authenticate + rate-limit `help-me-now` AI endpoint  `[P0 · Critical]`

**Why sixth:** live financial exposure (uncapped AI spend).

**How we fix it:**
1. Set `verify_jwt = true` for `help-me-now` in `config.toml` (or validate inside the function using the Supabase client with the caller's JWT).
2. Inside the function: after JWT validation, check `has_active_entitlement(auth.uid())` and reject with 403 otherwise.
3. Add per-user rate limit: create a small `ai_rate_limits` table (`user_id`, `window_start`, `count`) with `UNIQUE(user_id, window_start)`. Reject if the caller has exceeded N calls per rolling hour (default N=30, tune to your needs).
4. Return generic error messages; never echo LLM error detail to the client.

**Verification:** curl with no auth → 401. Valid JWT, no entitlement → 403. Entitled, under limit → 200. Fire N+1 requests in an hour → 429 on the last one.

**Risk:** none for legitimate users.

---

## TASK 7 — Whitelist `returnUrl` in Stripe checkout / billing portal  `[P1 · Medium]`

**Why now:** it's a small change that removes a phishing vector that reflects off your domain.

**How we fix it:**
1. In `create-checkout-session` and `create-billing-portal`: define `ALLOWED_ORIGINS` = `[app.liberatedkings.com, king-mindset-flow.lovable.app, https://*.lovable.app for preview]`.
2. Reject any `returnUrl` whose parsed host isn't on the list.
3. Prefer path-only from the client: server prefixes with the caller's `Origin` header (validated against the same list).

**Verification:** POST with `returnUrl=https://evil.example` → 400. With allowed URL → 200. With path only → server-prefixed URL used.

---

## TASK 8 — Harden SECURITY DEFINER functions (grants + role checks)  `[P1 · Medium-High]`

**Why now:** batches Findings 7, 14, 16.

**How we fix it:**
1. Dump `pg_proc` for every function `WHERE prosecdef = true` in `public`. For each function, decide the correct role: `authenticated`, `service_role`, admin-only, or none.
2. For each function: `REVOKE ALL ON FUNCTION public.<fn>(...) FROM PUBLIC, anon` and re-grant explicitly.
3. Inside admin-only functions, add `IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'not authorized'; END IF;`.
4. In user-scoped functions where a `_user_id` argument shouldn't be trusted (called by the user themselves), replace with `auth.uid()` internally or assert `_user_id = auth.uid()`.
5. Adopt this as a written rule for future definer functions.

**Verification:** as a normal user, RPC to each hardened function behaves correctly (allowed ones work, admin-only ones return "not authorized"). Anonymous RPC to all definer functions → 401/403.

---

## TASK 9 — Neutralize account enumeration on `check-user-eligible`  `[P1 · Medium]`

**How we fix it:**
1. Return an identical response shape and status regardless of whether the email exists.
2. Add a fixed timing floor (e.g. `await sleep(150ms)` after the lookup) so response time doesn't leak existence.
3. Add per-IP rate limit (reuse the primitive from Task 6).
4. If existing UI depends on the distinguishable response, change it to trigger the next-step email regardless and let the email flow handle "no such account" silently.

**Verification:** curl for a known and unknown email → identical body, status, and response time within tolerance. UI flow still works for real users.

---

## TASK 10 — Enable HIBP leaked-password protection  `[P1 · Low effort, high value]`

**How we fix it:**
1. `configure_auth` with `password_hibp_enabled: true`.
2. Optionally enable minimum-strength policy.

**Verification:** try to set password `"password123"` → rejected. Try a strong unique password → accepted.

---

## TASK 11 — Centralize chat input validation + sanitize HTML surfaces  `[P1 · Medium]`

**How we fix it:**
1. Add Zod schema on `chat_messages.content` at the composer: trim, length cap 4000, reject control chars.
2. Add DB `CHECK (length(content) BETWEEN 1 AND 4000)` and normalize on trigger.
3. Audit every render surface for `dangerouslySetInnerHTML` — chat views, admin moderation, email digests, notifications. Any that render HTML must go through DOMPurify or be switched to text rendering.
4. Normalize unicode (`.normalize('NFKC')`) on write to neutralize RTL-override tricks.

**Verification:** XSS payload posted → renders as inert text everywhere. Empty message → rejected. 10k-char message → rejected. RTL override in a display name → sanitized.

---

## TASK 12 — Enforce publish-status filtering on curriculum config tables  `[P1 · Low-Medium]`

**Batches Findings 8 + 12.** Same shape as Task 5 but for `curriculum_settings`, `weeks`, `modules`, `programs` — restrict draft rows to admin.

**Verification:** anonymous fetch returns only published; admin sees everything; content editors still function.

---

## TASK 13 — Data-minimize `admin_audit_log` + retention  `[P1 · Medium]`

**How we fix it:**
1. Whitelist which fields get logged. Explicitly redact `temp_password` (should be gone by Task 1), tokens, emails where the actor already implies identity.
2. Add a `retention_days` policy (default 365) and a scheduled `pg_cron` job that prunes.
3. Confirm `SELECT` restricted to admin.

**Verification:** perform an admin action, inspect the log row — no sensitive fields present. Run the cleanup manually — old rows removed.

---

## TASK 14 — Fix entitlement fallback + handle Stripe refunds/disputes  `[P2 · High]`

**How we fix it:**
1. In `useEntitlement.ts`, add `.gt('current_period_end', new Date().toISOString())` to the fallback subscription query.
2. Extract a single canonical function `public.compute_effective_entitlement(user_id)` (already close — `has_active_entitlement` covers most of it) and route both webhook and client through it.
3. In `stripe-webhook`, add `charge.refunded`, `charge.dispute.created`, `charge.dispute.funds_withdrawn` to the handled list. On these events, deactivate the entitlement immediately (unless an admin_grant is still valid — same guard as existing code).

**Verification:** issue a refund in Stripe test → user's entitlement flips inactive within seconds. Cancel + refund → paywall triggers on next reload.

---

## TASK 15 — Schedule `deactivate_expired_entitlements` + trial-expiry emails  `[P2 · Medium]`

**How we fix it:**
1. `SELECT cron.schedule('deactivate-expired-entitlements', '0 * * * *', $$ SELECT public.deactivate_expired_entitlements(); $$)`.
2. Add a T-7 and T-1 email flow for trial users (reuse Resend integration).

**Verification:** cron job visible in `cron.job`. Manually create an entitlement with `expires_at = now() - 1h` and `active = true` → after cron run, `active = false`.

---

## TASK 16 — Add missing DB constraints  `[P2 · Medium]`

**How we fix it:**
1. Confirm and add if missing: `UNIQUE(user_id, entitlement_type)` on `entitlements`, `UNIQUE(stripe_customer_id)` on `stripe_customers`, `UNIQUE(stripe_event_id)` on `webhook_events`, `UNIQUE(user_id, channel_id)` on `chat_read_cursors`, `UNIQUE(email, code)` on `verification_codes`.
2. Refactor webhook idempotency to "attempt insert first, catch unique violation" so it's race-safe.

**Verification:** attempt duplicate insert → unique violation. Concurrent webhook fires → only one processed.

---

## TASK 17 — Standardize error responses across edge functions  `[P2 · Medium]`

**How we fix it:**
1. Wrap every edge function response in a helper that returns `{ error: 'Internal error', requestId }` and logs the detail server-side with the same `requestId`.
2. Standardize `401` (no auth), `403` (auth but no permission), `404` only for genuinely missing resources.

**Verification:** trigger a DB error → response body has no stack/schema info; server logs contain full detail under the same requestId.

---

## TASK 18 — Generic rate-limit primitive across edge functions  `[P2 · Medium-High]`

**How we fix it:**
1. Reuse the `ai_rate_limits` pattern from Task 6 as `edge_rate_limits(scope, key, window_start, count)` with `UNIQUE(scope, key, window_start)`.
2. Apply to: login-adjacent flows, password reset, verification code send, `check-user-eligible`, `help-me-now`.

**Verification:** exceed the limit on each protected endpoint → 429. Under the limit → normal response.

---

## TASK 19 — Sweep null/empty/boundary states  `[P2 · Medium]`

Quiet cleanup pass. I'll enumerate the exact issues after confirming with queries: users with no profile row, `entitlements` with null `expires_at` but `source='stripe'`, zero-week courses, empty chat messages, orphaned rows after user delete, unicode/RTL in display names. Each gets a targeted fix.

**Verification:** each identified case has a regression test or a manual repro that now behaves correctly.

---

## TASK 20 — Confirm Realtime channels match final RLS  `[P2 · Low]`

After Tasks 2, 5, 11, 12 land, re-verify that `chat_messages` and any other Realtime-published tables broadcast only what their RLS allows.

**Verification:** subscribe as an unentitled user → no lesson data comes through. Subscribe to a channel you're not a member of → no messages come through.

---

# Sequencing summary

- **This week (P0):** Tasks 1 → 2 → 3 → 4 → 5 → 6 (in order — 4 and 5 must ship together)
- **Next 2 weeks (P1):** Tasks 7 → 8 → 9 → 10 → 11 → 12 → 13
- **Following sprint (P2):** Tasks 14 → 15 → 16 → 17 → 18 → 19 → 20

Once you approve this list, say **"start task 1"** and I'll implement Task 1 only, verify it, and stop for review.
