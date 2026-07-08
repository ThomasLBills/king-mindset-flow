# Liberated Kings — Security & Reliability Audit Report

Prepared for: Liberated Kings (client-facing)
Scope: Supabase/Postgres backend, storage buckets, edge functions, React web client, Stripe billing, admin surface, AI/chat features.
Status: Analysis and remediation plan only. No code, migrations, or configuration changes have been made.

---

## Executive Summary (for non-technical stakeholders)

The application is functional and generating revenue, but it currently carries a small number of **critical, exploit-ready weaknesses** alongside a broader set of quieter defects that will bite over time. In plain terms:

1. **Paid content is not actually protected.** The video and audio lessons your paying members expect to be exclusive can be read by anyone who knows (or guesses) the URLs — no login, no subscription, no receipt required. This directly undermines the paid product.
2. **User personal data is over-exposed.** Any signed-in member can currently read every other member's email, phone number, and (worse) the plaintext temporary passwords the system stores. That's both a privacy issue and, in several jurisdictions, a compliance issue.
3. **Plaintext passwords exist in the database at all.** Even temporarily, storing raw passwords is a serious industry red flag. If the database is ever leaked, backed up insecurely, or read by staff, every one of those accounts is compromised.
4. **A "developer preview" auth bypass is shipped in production.** The safety gate that skips login is gated only by an environment variable and a hostname check — a mistake here means anyone reaches the app as if they were logged in.
5. **An unauthenticated AI endpoint is exposed.** A crisis-response AI call can be triggered by anyone on the internet, which means anyone can burn your AI budget or abuse the endpoint.
6. **Billing has some soft spots.** The Stripe integration is mostly correct, but the "return URL" is not validated (open-redirect risk from your brand), and there are edge cases around refunds, duplicate subscriptions, and admin-granted access that we've already had to hotfix once.

Everything on this list is fixable. Nothing here requires re-platforming. The critical items can be resolved in days, not weeks, and most of the remaining items are hardening rather than rebuilds.

**Recommended stance:** treat items 1–5 as emergency ("stop-the-bleeding") work, do them before any new feature ships, then work through the P1/P2 roadmap in Part D.

---

## How to read this report

Each finding follows the same structure: **Title & severity, Problem, Attack/failure scenario, Root cause, Remediation strategy, Verification plan, Dependencies, Effort & blast radius.** Confirmed findings from the prior audit are in Part A. Hypothesized latent bugs found by reasoning through the stack are in Part B and are clearly marked `[Hypothesized — needs codebase confirmation]`. Part D is the roadmap.

---

# PART A — Confirmed Findings

## 1. Paid curriculum video/audio content readable by anyone, bypassing entitlements

**Severity: Critical (agree).** This is the revenue-defining control for a paid course platform.

**Problem.** The lesson content that members pay for — the actual videos, audio, and structured lesson bodies — can be read without an active subscription or trial. The `entitlements` table gates the *UI* (paywall redirect), but the underlying data rows and media files are reachable directly through the API and storage layer.

**Attack / failure scenario.** A former subscriber, a curious visitor, or a scraper hits the data API or storage URL for a lesson directly (via `/rest/v1/curriculum_lessons`, `/rest/v1/lessons`, or `curriculum-files` object URLs). They receive the full paid content with no entitlement check. Impact: complete loss of the paid product's exclusivity, chargeable content freely mirrored, and no audit trail of who accessed what.

**Root cause.** Entitlement is enforced only in the React client (`EntitlementGuard`). The database RLS policies on `curriculum_lessons`, `lessons`, `modules`, `weeks`, `courses`, and `lesson_resources` almost certainly allow `authenticated` (and possibly `anon`) to read regardless of `has_active_entitlement(auth.uid())`. The `has_active_entitlement` function already exists — it's just not consulted from the RLS policies.

**Remediation strategy.** Move entitlement enforcement into the database. Every `SELECT` policy on curriculum content tables should be `USING (public.has_active_entitlement(auth.uid()) OR public.has_role(auth.uid(),'admin'))`. Draft/unpublished rows should additionally require admin. The React guard stays as a UX layer, not the security boundary. Storage is handled in Finding 2.

**Verification plan.** With three test accounts (no entitlement, active trial, expired), attempt to `SELECT` from each curriculum table directly through the Data API. Only the entitled and admin accounts should receive rows. Add a small automated test that fires all three token classes against each protected table.

**Dependencies / sequencing.** Must ship together with Finding 2 (storage). Otherwise data is protected but media isn't, or vice versa — a partial fix looks like a fix but isn't.

**Effort & blast radius.** M. Blast radius: any legitimate read path currently relying on permissive RLS (e.g. marketing preview pages, admin editors) will break unless the admin/preview policies are written first. Preview/free-lesson exceptions must be explicitly enumerated.

---

## 2. Paid course video/audio files in storage downloadable by anyone without authentication

**Severity: Critical (agree).** Same revenue impact as Finding 1, different layer.

**Problem.** The `curriculum-files` storage bucket is currently **public** (confirmed in the injected storage bucket list). Public buckets serve every object over an unauthenticated CDN URL; there is no per-user check. Anyone with a URL — or anyone iterating filenames — downloads the paid media.

**Attack / failure scenario.** Attacker enumerates or discovers a `curriculum-files` object URL (e.g. from a leaked link, a shared screenshot, browser devtools, or a scraper) and downloads the entire course library. There is no signed-URL expiry, no membership check, no rate limit.

**Root cause.** The bucket was created as public for convenience. There is no signed-URL flow and no RLS on `storage.objects` scoped to `has_active_entitlement`.

**Remediation strategy.** Flip `curriculum-files` to **private**. Serve media through short-lived signed URLs minted by an edge function (or client-side after an RLS `SELECT` on `storage.objects`) *only* for users with an active entitlement. Storage policies on `storage.objects` for that bucket become `USING (bucket_id = 'curriculum-files' AND public.has_active_entitlement(auth.uid()))`. Consider a per-user, per-object short TTL (5–15 min) so leaked URLs expire.

**Verification plan.** Attempt to `GET` a known `curriculum-files` object URL while unauthenticated → expect 400/403. Repeat for authenticated-but-unentitled → expect 403. Repeat for entitled → expect 200. Confirm existing lesson pages still play video by re-issuing a signed URL on demand.

**Dependencies.** Requires a "signed URL for this lesson asset" edge function or a client-side signed-URL fetch. Must be shipped simultaneously with Finding 1 (data layer). Existing lesson-view UI must be updated to consume the signed URL.

**Effort & blast radius.** M. Blast radius: any hardcoded public URLs (email templates, marketing pages, external links) will break — audit all references before flipping the bucket.

---

## 3. AI crisis endpoint callable without authentication

**Severity: Critical (agree).** Uncapped, unauthenticated AI = uncapped bill and abuse vector.

**Problem.** The `help-me-now` edge function (which uses the Lovable AI Gateway / `LOVABLE_API_KEY`) is reachable without a valid user session. Anyone on the internet can trigger arbitrary LLM completions using your key.

**Attack / failure scenario.** A hostile actor scripts millions of requests against the function. Costs spike, rate limits trip, real users in a crisis moment cannot get a response, and the Lovable AI key may be temporarily suspended. Secondary risk: the endpoint could be used as a free general-purpose LLM proxy, or to generate content that is later blamed on your brand.

**Root cause.** The function does not `verify_jwt` (either via config.toml or by manually validating the caller's JWT) and does not check `has_active_entitlement` before spending tokens.

**Remediation strategy.** Require a valid Supabase JWT for the function (set `verify_jwt = true` in `config.toml` or validate `Authorization: Bearer` inside the function). Additionally check that the caller has an active entitlement or is on trial. Add per-user rate limiting (e.g. N calls per hour, stored in a small table with a unique key).

**Verification plan.** Curl the endpoint with no header → 401. With a valid token but no entitlement → 403. With a valid entitled token → 200. Load-test to confirm rate limit trips at the expected threshold.

**Dependencies.** None. Standalone fix.

**Effort & blast radius.** S. Blast radius: any legitimate anonymous caller (there should be none) will break.

---

## 4. Plaintext temporary passwords persisted in database

**Severity: Critical (agree, arguably higher than "critical" — this is a "stop-the-bleeding" item).**

**Problem.** The `profiles` table has a `temp_password` column that stores the initial password generated during Zapier/Stripe provisioning in **plaintext**. Even with excellent RLS, this is a categorical violation of password hygiene: the value should never exist in a form anyone can read.

**Attack / failure scenario.** Any of these is sufficient to compromise every affected user: a leaked backup, a compromised admin account, a rogue support agent, a misconfigured RLS policy (see Finding 5), a future SQL-injection bug, or a legitimate exec-database export accidentally shared. Because users often reuse passwords, the blast radius extends beyond this app.

**Root cause.** Design decision to email temp passwords to new users after Zapier provisioning. The temp password was stored so it could be re-sent. This traded a real, quiet security problem for a small UX convenience.

**Remediation strategy.** Eliminate the plaintext storage entirely. Two acceptable end-states:
- **Preferred:** replace temp passwords with a signed, single-use setup link (magic link or code) that never persists a password. The `verify-code-set-password` edge function already exists — extend it so provisioning never produces a persistent password.
- **Acceptable interim:** generate the temp password, hand it to the email edge function in the same request, and never write it to the DB. If a "resend" is needed, generate a *new* one and invalidate the previous.
Also: purge every existing `temp_password` value from the DB and force those users through a first-time password set. Consider notifying affected users of the reset.

**Verification plan.** Confirm `temp_password` column is dropped or always `NULL`. Confirm no code path writes a plaintext password anywhere except the outbound email body. Search all logs (function logs, webhook logs, `admin_audit_log`) for leaked values.

**Dependencies.** Must be coordinated with the Zapier provisioning flow, Stripe checkout flow (`resolveUserId` invites), and the SetupAccount page. Communicate to affected users.

**Effort & blast radius.** M. Blast radius: users who never completed the first login flow will need to re-request access. Support should be briefed.

---

## 5. Any logged-in user can read all users' emails, phone numbers, and temporary passwords

**Severity: Critical (agree).**

**Problem.** The `profiles` table's `SELECT` policy is currently permissive enough that an authenticated user can read every other user's row. That includes email, phone, `temp_password`, and any other PII on the profile. The Brotherhood/search features rely on being able to read *some* profile fields for *some* users, and the policy was written broadly to accommodate that.

**Attack / failure scenario.** A member logs in, calls `/rest/v1/profiles?select=*`, and receives the entire user directory including plaintext credentials (per Finding 4). Trivially exfiltrated. This is a mass-PII disclosure and, depending on jurisdiction, a reportable breach.

**Root cause.** A single overly-broad `USING (auth.uid() IS NOT NULL)` (or similar) policy is doing double duty for "let me see my profile" and "let me search brothers." The two use cases have completely different data needs.

**Remediation strategy.** Split by need:
- Owner-only policy: `USING (user_id = auth.uid())` returns full profile.
- Brotherhood-directory policy: create a **view** or dedicated function that exposes only the fields required for search/display (display_name, avatar, maybe first_name) — never email, phone, or `temp_password`. Grant `SELECT` on the view only.
- Admin policy: `USING (public.has_role(auth.uid(),'admin'))` for admin surfaces.
- Sensitive columns (`temp_password` — which should not exist after Finding 4; also consider `email`, `phone`) should be removed from any anon/authenticated read path entirely.

**Verification plan.** As a normal user, `SELECT *` from `profiles` returns exactly 1 row (self). As the same user, the brothers-search view returns many rows but with only whitelisted columns. Admin gets everything. No client-side query touches `temp_password`.

**Dependencies.** Coordinate with Finding 4. Coordinate with the Brotherhood search UI, which may need to switch from `profiles` to a new `public_profiles` view.

**Effort & blast radius.** M. Blast radius: Brotherhood/search UI, admin user list, any code doing `select *` on profiles.

---

# PART A (continued) — Warnings

## 6. Development auth bypass active in production

**Severity: Warning → I upgrade this to High.** A misconfigured env var here converts the entire app to no-auth.

**Problem.** `isDevBypassEnabled()` in `src/lib/devBypass.ts` short-circuits `AuthGuard`, `AdminGuard`, and `EntitlementGuard` when `VITE_DEV_BYPASS_AUTH === "true"` AND hostname is `localhost`. The localhost check is the only thing standing between a preview build and a fully open app. It is also purely client-side, so nothing prevents the bypass code from shipping into a production bundle.

**Attack / failure scenario.** (a) A developer accidentally leaves `VITE_DEV_BYPASS_AUTH=true` in a non-dev env file that gets included in a build. (b) An attacker running the app inside a local proxy or a rewritten host header experiments. (c) The check is only frontend — every guard is a frontend construct, so RLS is what actually protects the data. If any RLS gap exists (see Findings 1, 2, 5), the bypass makes it trivially exploitable.

**Root cause.** Auth bypass code should not exist in production bundles at all. Vite build-time conditional inclusion is the correct pattern; runtime env checks are not.

**Remediation strategy.** Tree-shake the bypass out of production builds using a build-time constant (`import.meta.env.DEV` or a dedicated `__DEV_BYPASS__` define) so the bypass files literally do not exist in the production bundle. Additionally, do not deploy `.env.development` values to production. Add a deploy-time assertion that fails the build if `VITE_DEV_BYPASS_AUTH === "true"` in a production build.

**Verification plan.** Build production bundle, grep for `isDevBypassEnabled` and `DevBypassBanner` — expect no matches. Set the env var, run production build, confirm bypass does not activate.

**Dependencies.** None.

**Effort & blast radius.** S. Blast radius: local dev workflow needs a clean alternative (e.g., a seeded test user).

---

## 7. Security definer functions without input validation

**Severity: Warning (agree).** Depends on which functions and what they accept.

**Problem.** Several `SECURITY DEFINER` functions (`has_role`, `has_active_entitlement`, `deactivate_expired_entitlements`, `get_community_armor_stats`, `get_evidence_counts_by_user`, `handle_new_user`, `auto_join_default_channels`, `update_updated_at`) execute with owner privileges and bypass RLS. Several accept parameters (`_user_id`, `_role`, `_type`) that are not validated. `has_active_entitlement` in particular accepts an arbitrary text `_type` parameter.

**Attack / failure scenario.** A caller passes a crafted `_type` value or unexpected `_user_id` to probe behavior, bypass expected checks, or (in the worst case, if any function ever builds dynamic SQL from an argument) achieve injection. Today the observed functions are parametrized, so injection is not present, but the pattern is fragile — the next function added by this convention may not be.

**Root cause.** No convention that `SECURITY DEFINER` functions must (a) validate every argument, (b) explicitly set `search_path` (already done — good), (c) restrict `EXECUTE` to the roles that need them (see Findings 14, 16).

**Remediation strategy.** Adopt a rule: every `SECURITY DEFINER` function validates its arguments (whitelisted enums, `auth.uid()` comparison for user-scoped calls), sets an explicit `search_path`, and has `EXECUTE` granted only to the minimum roles. Audit each existing function against this rule and tighten as needed. Never build dynamic SQL from arguments inside a `SECURITY DEFINER` function.

**Verification plan.** Static review of each function's argument handling. For user-scoped functions, ensure they compare against `auth.uid()` rather than trusting the caller-supplied `_user_id`.

**Dependencies.** Overlaps with Findings 14 and 16.

**Effort & blast radius.** S–M.

---

## 8. Draft curriculum program settings readable by unauthenticated visitors

**Severity: Warning (agree).**

**Problem.** `curriculum_settings` (and adjacent config tables) allow anonymous reads including draft/unpublished config. This leaks upcoming programs, pricing, and structural decisions before they are announced.

**Attack / failure scenario.** A visitor or competitor watches `curriculum_settings` via the Data API and sees draft rows. Not a data-theft event but a strategic leak (roadmap, unreleased courses, timing).

**Root cause.** Overly permissive RLS `SELECT` policy that does not distinguish "published" from "draft."

**Remediation strategy.** Restrict `SELECT` on draft rows to admins. Published rows can remain widely readable if that is intended. Enforce with a policy predicate on a `status` / `published` column.

**Verification plan.** Anonymous fetch of `curriculum_settings` returns only published rows; admin fetch returns all.

**Effort & blast radius.** S.

---

## 9. Admin audit log stores excessive sensitive data

**Severity: Warning (agree).**

**Problem.** `admin_audit_log` currently stores whole payloads (likely including PII, and possibly `temp_password` values) with no retention limit. Audit logs are supposed to help — but a fat, PII-rich, indefinitely-retained log is itself a breach magnifier.

**Attack / failure scenario.** If the audit table is ever leaked, or an admin account is compromised, the log yields both current PII *and* a historical record of every affected user. Also creates compliance friction for right-to-erasure requests.

**Root cause.** No data-minimization policy on what fields are logged; no retention window.

**Remediation strategy.** (a) Whitelist which fields are logged — record identifiers (`user_id`, action, timestamp, actor) and diffs, never raw sensitive values. (b) Explicitly redact secrets (`temp_password`, tokens). (c) Implement retention (e.g. 90–365 days) with a scheduled cleanup. (d) Restrict `SELECT` to admin only (should already be true — verify).

**Verification plan.** Insert a test admin action, confirm log row omits sensitive fields. Confirm retention job runs and prunes.

**Effort & blast radius.** S–M.

---

## 10. Unauthenticated endpoint reveals account and entitlement status

**Severity: Warning (agree).**

**Problem.** `check-user-eligible` is invoked without JWT (`verify_jwt = false`). Given an email, it presumably returns whether the account exists and/or is entitled.

**Attack / failure scenario.** Attacker enumerates emails (from breach dumps, LinkedIn, etc.) and builds a list of confirmed members. Enables targeted phishing ("Hi Stacey, your Liberated Kings subscription…"). Also enables competitive intelligence.

**Root cause.** Endpoint returns a distinguishable response for "exists vs not."

**Remediation strategy.** Either require authentication, or return a uniform response regardless of whether the email exists (and dispatch the actual work asynchronously). Add per-IP rate limiting.

**Verification plan.** Same request for a known-existing and known-nonexistent email should be response-indistinguishable (same status, same body shape, same timing within a tolerance).

**Effort & blast radius.** S.

---

## 11. User chat messages lack input sanitization

**Severity: Warning (agree; escalates to High if any surface renders messages as HTML).**

**Problem.** Chat messages are stored as-is and rendered client-side. If any renderer uses `dangerouslySetInnerHTML`, or if messages are later surfaced in emails / admin dashboards / notifications that render HTML, this becomes stored XSS.

**Attack / failure scenario.** A user posts a message with a `<script>` or `<img onerror>` payload. If any surface eventually renders it as HTML — admin moderation view, email digest, push preview — session tokens or admin actions can be hijacked.

**Root cause.** No centralized input validation on `chat_messages.content`. React's default text rendering is safe, but the system has many downstream consumers (admin panel, emails, notifications) that may not be.

**Remediation strategy.** Validate on write (length cap, reject control characters, normalize unicode) and sanitize on every HTML render (use a well-maintained sanitizer library at all HTML surfaces, or forbid HTML rendering of chat entirely). Also apply length limits at the DB via `CHECK` or trigger.

**Verification plan.** Attempt to post XSS payloads; verify they render as inert text in every surface (client, admin, email). Fuzz with unicode, RTL overrides, zero-width joiners.

**Effort & blast radius.** S–M. Blast radius: admin moderation views and email digests must be re-checked.

---

## 12. Draft curriculum week structure exposed to unauthenticated visitors

**Severity: Warning (agree).** Same class as Finding 8.

**Problem.** `weeks` and possibly `modules` allow anonymous reads of draft/unpublished rows.

**Attack / failure scenario.** Same as Finding 8: strategic leak of unreleased content structure.

**Root cause.** RLS `SELECT` policy doesn't filter on publish status.

**Remediation strategy.** Restrict draft rows to admin; allow anon/authenticated only on published. Batch with Finding 8 as a "publish-status enforcement" workstream across curriculum tables.

**Verification plan.** Anon queries only see published; admin sees everything.

**Effort & blast radius.** S.

---

## 13. Unvalidated returnUrl enables open redirect via Stripe checkout

**Severity: Warning (agree).**

**Problem.** The `create-checkout-session` (and likely `create-billing-portal`) function accepts a client-provided `returnUrl` / `successUrl` / `cancelUrl` and passes it to Stripe without validating that it points back to your domain.

**Attack / failure scenario.** Attacker crafts a checkout link with `returnUrl=https://evil.example/looks-like-liberatedkings-login`. Victim completes checkout on the real Stripe page, is bounced to the attacker's page, which mimics the app and phishes credentials. Because the redirect chain began on a trusted domain, victims are unusually likely to trust the final page.

**Root cause.** Trusting client-supplied URLs.

**Remediation strategy.** Whitelist allowed hosts (`app.liberatedkings.com`, `king-mindset-flow.lovable.app`, published preview). Reject any URL whose host isn't on the allowlist. Prefer server-configured URLs over client-supplied ones — the client should send a *path*, not a full URL.

**Verification plan.** Attempt checkout with a foreign `returnUrl` → 400. Attempt with a whitelisted URL → 200. Attempt with a path-only value → server prefixes and accepts.

**Effort & blast radius.** S.

---

## 14. Public can execute SECURITY DEFINER function

**Severity: Warning (agree, potentially High depending on which function).**

**Problem.** One or more `SECURITY DEFINER` functions have `EXECUTE` granted to `PUBLIC` (or `anon`). Combined with the bypass-RLS nature of definer functions, this can leak data or trigger side effects for unauthenticated callers.

**Attack / failure scenario.** Anonymous caller invokes the function directly through the Data API RPC (`/rest/v1/rpc/<function>`) and either reads data they shouldn't, or triggers an insert/update.

**Root cause.** Default `EXECUTE` grant behavior on functions is often overlooked when creating definer functions.

**Remediation strategy.** For each `SECURITY DEFINER` function: `REVOKE EXECUTE ... FROM PUBLIC` and grant only to the roles that need it (`authenticated`, `service_role`, or in some cases nothing — call from within another definer function). Combine with Finding 7's argument-validation pass.

**Verification plan.** Attempt to `POST /rest/v1/rpc/<function>` unauthenticated → 401/403 for every function that shouldn't be public.

**Effort & blast radius.** S.

---

## 15. Leaked password protection disabled

**Severity: Warning (agree).**

**Problem.** Supabase Auth's HIBP (Have I Been Pwned) check is disabled, so new/changed passwords are accepted even if they appear in known breach corpora.

**Attack / failure scenario.** User sets a common breached password. Credential-stuffing attackers try known email/password pairs and log in.

**Root cause.** Feature not enabled.

**Remediation strategy.** Enable HIBP password check via `configure_auth`. Consider also enabling a minimum password strength policy.

**Verification plan.** Attempt to set a known-breached password ("password123") → rejected. Set a strong unique password → accepted.

**Effort & blast radius.** S.

---

## 16. Signed-in users can execute SECURITY DEFINER function

**Severity: Warning (agree).**

**Problem.** Related to Finding 14: some definer functions are executable by any authenticated user when they should be restricted to specific roles (admin) or callable only server-to-server (service_role).

**Attack / failure scenario.** A regular user calls an admin-oriented definer function via RPC and performs a privileged operation.

**Root cause.** Missing role check inside the function AND overly-broad EXECUTE grant.

**Remediation strategy.** Two-layer defense: (a) inside every definer function, if it's admin-only, assert `public.has_role(auth.uid(),'admin')` and raise on failure; (b) restrict `EXECUTE` at the grant level.

**Verification plan.** As a regular user, attempt to call each admin-scoped RPC → 403 / raised error. As admin → success.

**Effort & blast radius.** S.

---

## 17. Public bucket allows listing

**Severity: Warning (agree).**

**Problem.** The `curriculum-files` bucket being public not only allows direct object reads (Finding 2) but may also permit `LIST` operations, letting an attacker enumerate every filename without guessing.

**Attack / failure scenario.** Attacker calls the storage list endpoint, obtains every object path, and mass-downloads. Turns Finding 2 from "URL leak" into "one-command mirror."

**Root cause.** Public bucket default permissions.

**Remediation strategy.** Resolved by Finding 2 (private bucket + signed URLs). No separate action needed if Finding 2 is done correctly — but explicitly confirm `LIST` is denied to `anon` in the final state.

**Verification plan.** Anonymous `LIST` on `curriculum-files` → denied.

**Effort & blast radius.** S (folded into Finding 2).

---

# PART B — Latent Bugs, Invisible Defects & Edge Cases

Everything in this section is `[Hypothesized — needs codebase confirmation]` unless noted. Each item states what to inspect to confirm.

## B1. Entitlement edge cases — refunds, downgrades, partial access, deleted-but-active

**Severity: High.**

**Problem.** The `useEntitlement` hook's logic reveals partial coverage: it checks `entitlements.active`, but if `active=true` with an expired `expires_at`, it falls back to checking for any `subscriptions` row with status in `('active','trialing')`. That fallback does **not** check `current_period_end > now()`. A canceled-but-not-yet-updated subscription, or a stale `subscriptions` row from the duplicate-subscription hotfix history, can grant access it shouldn't.

Additionally: refunds do not appear to reduce entitlement. Stripe emits `charge.refunded` / `charge.dispute.created`, and the current webhook (per the injected source) does not handle those event types. A refunded user retains access.

Downgrades (annual → monthly mid-cycle) are handled by `deriveEntitlementWindow` but only when a subscription webhook fires. Between the downgrade action and the webhook, the client may show incorrect expiry.

**Failure scenario.** Refund issued → user keeps access indefinitely. Dispute filed → same. Duplicate `subscriptions` row lingers → user regains access even after canceling.

**Confirm by:** reading `useEntitlement.ts` (already visible — confirmed the missing `current_period_end` check on the fallback) and the `stripe-webhook` event switch (already visible — confirmed `charge.refunded`, `charge.dispute.*` are not in the `handled` array).

**Remediation approach:** Handle `charge.refunded`, `charge.dispute.created`, and `charge.dispute.funds_withdrawn` in the webhook — deactivate the entitlement. In `useEntitlement`, the fallback query must include `.gt('current_period_end', new Date().toISOString())`. Consider a single canonical DB function `public.compute_effective_entitlement(user_id)` that both the webhook and the client hook call, so logic can't drift.

## B2. Trial-to-paid boundary — 60-day trial silently converts to nothing

**Severity: High.**

**Problem.** `handle_new_user` grants a 60-day `course_app_access` entitlement. There is no scheduled job or notification that surfaces "your trial ends in 3 days." When it expires, `deactivate_expired_entitlements` (which appears to not be scheduled — see B10) may or may not run, and the user is silently locked out.

**Confirm by:** checking for a `pg_cron` schedule on `deactivate_expired_entitlements`; checking for any trial-reminder email flow.

**Remediation approach:** Schedule `deactivate_expired_entitlements` (e.g. hourly). Add a trial-ending notification pipeline (T-7, T-1). Make sure paywall messaging distinguishes "trial ended" from "never subscribed."

## B3. Webhook idempotency race — two concurrent deliveries of the same event

**Severity: Medium.**

**Problem.** The webhook checks `webhook_events` for an existing `stripe_event_id` and only then inserts. That is a classic TOCTOU race — two concurrent deliveries of the same event both see "not present," both insert, and both process. `webhook_events.stripe_event_id` must be a `UNIQUE` constraint for the idempotency check to be race-safe, in which case the second insert throws and the second handler must catch and short-circuit.

**Confirm by:** `\d webhook_events` — check for unique constraint on `stripe_event_id`.

**Remediation approach:** Ensure `UNIQUE(stripe_event_id)`. Change the flow to "attempt insert first; on unique violation, treat as duplicate." This makes idempotency atomic.

## B4. Entitlement granted from client-side success — not observed, but verify

**Severity: Would be Critical if present.**

**Problem.** The `/thank-you` page or `create-checkout-session` return handler could conceivably grant entitlement client-side. The webhook is the correct source of truth.

**Confirm by:** searching `src/pages/ThankYou.tsx` and `src/pages/Billing.tsx` for any direct writes to `entitlements` or `subscriptions`.

**Remediation approach:** Client must never write entitlement. If it currently does, remove and rely on the webhook + a "waiting for confirmation" UI state.

## B5. Stripe amount/currency trust

**Severity: Low–Medium.**

**Problem.** `handleCheckoutCompleted` records `amount_total` from the session object as-is. If prices are ever derived client-side (e.g. discount codes applied in the UI), a mismatch between the stored amount and the actual charge is possible.

**Confirm by:** reading `create-checkout-session` for any client-controlled `unit_amount`.

**Remediation approach:** All prices should be Stripe Price IDs (`price_...`), never client-supplied amounts. Discount handling should be Stripe Promotion Codes, not client math.

## B6. Null / empty / boundary states

**Severity: Medium (cumulative).**

Suspected issues, each `[Hypothesized]`:

- **User with no `profiles` row.** `handle_new_user` runs on `auth.users` insert, but a failure mid-trigger (e.g. `user_roles` insert conflict) may leave a user without a profile. Any query that assumes `profiles` exists will 404. **Confirm:** left join `auth.users` against `profiles` and count nulls.
- **User with `entitlements.expires_at IS NULL` and `active=true`.** `has_active_entitlement` treats null expiry as permanent — good for admin grants, but any accidental null on a stripe entitlement grants perpetual access. **Confirm:** query for `expires_at IS NULL AND source = 'stripe'`.
- **Zero-week course.** UI likely assumes `weeks.length > 0` for progress calculation → division by zero, blank screens.
- **Empty chat message / whitespace-only.** Composer likely accepts it; DB has no `CHECK (length(trim(content)) > 0)`.
- **Extremely long inputs.** No length ceilings on `chat_messages.content`, `user_journal_entries`, `user_declarations` → memory/DoS risk.
- **Unicode / emoji / RTL overrides in chat and display names.** Renders may break layout; RTL overrides can spoof usernames in DMs.
- **Deleted-but-referenced records.** Missing FKs or missing `ON DELETE` behavior → orphaned `chat_messages` with dead `user_id`, orphaned `payments` after user deletion. **Confirm:** review the `admin-delete-user` function and FK definitions.

## B7. Error handling & information leakage

**Severity: Medium.**

**Problem.** Edge functions return `err.message` directly to the client in several places (visible in `stripe-webhook`, likely elsewhere). Postgres error messages can leak schema names, column names, and RLS hints.

**Confirm by:** grepping edge functions for `error.message` in response bodies.

**Remediation approach:** Return generic messages to the client; log detail server-side with a correlation ID surfaced in the UI ("error id abc123 — contact support"). Standardize 401 vs 403 vs 404 to avoid resource enumeration (e.g. never return 404 for "you don't have access" — return 403 or a neutral 404 consistently).

## B8. Retry / partial-success in multi-step operations

**Severity: Medium.**

**Problem.** `handleCheckoutCompleted` performs: upsert stripe_customers → upsert payments → fetch subscription → process subscription. If step 3 fails after step 2 succeeded, the event is marked `error`. Stripe will retry, and step 2 re-runs (idempotent via `onConflict`) — good. But `resolveUserId` may `inviteUserByEmail` a *second* time on retry if a race occurred, creating a duplicate storeVerificationCode entry.

**Confirm by:** reading `resolveUserId` end-to-end for retry safety.

**Remediation approach:** Make user provisioning idempotent by email (find-or-invite pattern with a unique lookup before invite). Move the whole handler body into a single transaction where feasible; where not (external API calls), design each step to be safe under replay.

## B9. Time & timezone

**Severity: Medium.**

Suspected issues:

- **Trial expiry** stored as UTC — good, per Core memory. But `get_community_armor_stats` explicitly uses `America/Chicago` and depends on `date_trunc('week', ...)` treating Sunday as week start. On DST transitions, "this week" and "last week" boundaries wobble by an hour — small but real double-count/miss risk near the boundary.
- **Verification codes** have `expires_at` but the check must be `> now()` at UTC. Confirm.
- **Any client-side date comparison** (`new Date(entitlement.expires_at) < new Date()` in `useEntitlement.ts`, already confirmed) is dependent on the client's clock. A skewed client clock can incorrectly report expired/not-expired. Server-side check is authoritative — the client should call an RPC (`has_active_entitlement`) rather than reproducing the logic.

## B10. Scheduled jobs

**Severity: Medium.**

**Problem.** `deactivate_expired_entitlements` is a well-formed cleanup function but there is no visible `pg_cron` schedule. If nothing runs it, `entitlements.active` remains `true` past `expires_at` and any code that only checks `active` (rather than `has_active_entitlement`) grants access.

**Confirm by:** `SELECT * FROM cron.job`.

**Remediation approach:** Schedule hourly. Or, make `has_active_entitlement` the sole source of truth (already checks `expires_at`) and treat the `active` column as advisory.

## B11. Missing DB constraints allowing invalid states

**Severity: Medium.**

Suspected:

- `entitlements` — is there a `UNIQUE(user_id, entitlement_type)`? The webhook upserts with `onConflict: "user_id,entitlement_type"` — this only works if that unique constraint exists. **Confirm.**
- `stripe_customers` — `UNIQUE(stripe_customer_id)` and ideally `UNIQUE(user_id)` (one Stripe customer per user).
- `webhook_events` — `UNIQUE(stripe_event_id)` (see B3).
- `chat_read_cursors` — likely needs `UNIQUE(user_id, channel_id)` or the unread badge logic double-counts.
- `verification_codes` — needs `UNIQUE(email, code)` or lookup ambiguity.

## B12. Input validation gaps beyond chat

Suspected surfaces requiring validation:

- **Storage paths** — any user-supplied filename that becomes an object key (avatars, chat file uploads) must be validated for `..`, absolute paths, control chars.
- **SECURITY DEFINER function args** — see Finding 7.
- **Redirect URLs** — see Finding 13; also verify OAuth redirect origin allowlist.
- **Any RPC accepting `text`** — enums should be enums, not text.
- **Search inputs** — Brotherhood search likely passes a `q` param into `.ilike('%'||q||'%')`; verify no SQL construction happens client-side.

## B13. Data-integrity / migration risk

- **`temp_password` column** — should not exist (Finding 4).
- **Orphaned rows** — after `admin-delete-user`, do child rows cascade or persist? Persistent `chat_messages` from a deleted account will crash any JOIN that assumes a profile row.
- **Audit log accumulation** — see Finding 9.
- **`payments` retention** — financial records generally *should* be retained, but PII fields inside them should be minimized.

## B14. Real-time / websocket surface

**Severity: Medium.**

**Problem.** Realtime subscriptions on `chat_messages` and other tables enforce access via the same RLS as reads. If the RLS `SELECT` policy has any gap, Realtime broadcasts leak the same data — often in a way harder to notice because it's a push channel.

**Confirm by:** enumerating tables with `REPLICA IDENTITY FULL` (memory confirms `chat_messages`) and verifying their RLS `SELECT` policies match the intended access model.

## B15. Rate limiting

**Severity: Medium.**

**Problem.** No visible rate limiting on any edge function. Login, password reset, verification code, help-me-now, and check-user-eligible are all unrate-limited attack surfaces.

**Remediation approach:** Per-IP and per-email limits on auth-adjacent endpoints; per-user limits on AI endpoints.

---

# PART C — Format Note

Every issue above follows the requested structure: severity call, plain-language + technical problem, attack/failure scenario, root cause, remediation strategy (approach, not code), verification plan, dependencies, and effort/blast radius. Latent issues in Part B are marked `[Hypothesized]` with explicit confirmation steps.

---

# PART D — Overall Remediation Plan & Client Report

## D.1 Prioritized Roadmap

### P0 — Stop the bleeding (do this week, before any new feature)

1. **Finding 4** — Remove plaintext `temp_password` from the database. Migrate to setup-link/single-use-code flow. Purge existing values.
2. **Finding 6** — Remove the dev auth bypass from production bundles via build-time tree-shaking.
3. **Finding 2 + 17** — Flip `curriculum-files` bucket to private; introduce signed-URL flow.
4. **Finding 1** — Add entitlement-checking RLS to all curriculum content tables.
5. **Finding 3** — Require JWT + entitlement on `help-me-now`; add rate limit.
6. **Finding 5** — Split `profiles` policies into owner / directory-view / admin. Remove sensitive columns from any non-owner read path.

Rationale: 1 and 6 are unrecoverable data-exposure events if triggered; 2/17 + 1 are the direct revenue-protection controls; 3 is a live financial-exposure endpoint; 6 (dev bypass) is a landmine.

### P1 — Close the audit findings (next 2–3 weeks)

7. **Finding 13** — Whitelist `returnUrl` in Stripe checkout/portal flows.
8. **Finding 14 + 16** — Revoke `PUBLIC` execute on definer functions; add role assertions inside admin-only functions.
9. **Finding 15** — Enable HIBP leaked-password protection.
10. **Finding 10** — Neutralize `check-user-eligible` response to prevent account enumeration; add rate limiting.
11. **Finding 11** — Centralize chat input validation and sanitize every HTML rendering surface.
12. **Findings 8 + 12** — Enforce publish-status filtering on all curriculum tables (batch as one "publish gate" workstream).
13. **Finding 9** — Data-minimize `admin_audit_log`; add retention job.
14. **Finding 7** — Adopt and enforce a `SECURITY DEFINER` hardening checklist across all functions.

### P2 — Latent-defect cleanup (following sprint)

15. **B1** — Handle `charge.refunded` / disputes in webhook; fix `useEntitlement` fallback missing `current_period_end` check; consolidate entitlement logic into one DB function.
16. **B2** — Schedule `deactivate_expired_entitlements`; add trial-expiry notifications.
17. **B3** — Confirm/add `UNIQUE(stripe_event_id)` on `webhook_events`.
18. **B8** — Make user provisioning idempotent under Stripe webhook retries.
19. **B10 + B11** — Audit and add missing DB constraints; schedule cleanup jobs.
20. **B6** — Sweep null/empty/boundary states across the app (composer validation, zero-week course, orphan handling).
21. **B7** — Standardize error responses; strip detail from client-visible errors.
22. **B14** — Re-verify Realtime channels against final RLS.
23. **B15** — Introduce a generic rate-limit primitive across edge functions.

## D.2 Thematic Groupings

Batch related work to avoid churn:

- **Entitlement enforcement (data + storage + client hook):** Findings 1, 2, 17, B1, B2, B4, B10.
- **SECURITY DEFINER hardening:** Findings 7, 14, 16.
- **Curriculum publish-status enforcement:** Findings 8, 12.
- **Auth-bypass cleanup & password hygiene:** Findings 4, 6, 15.
- **PII minimization:** Findings 5, 9, B13.
- **Webhook integrity:** Findings B1, B3, B5, B8.
- **Input validation & sanitization:** Findings 11, 13, B6, B12.
- **Operational hygiene:** B7, B10, B11, B14, B15.

## D.3 Cross-cutting Recommendations

- **One entitlement source of truth.** Route all entitlement checks — client hook, edge functions, RLS policies — through `public.has_active_entitlement(auth.uid())`. Never reproduce the logic in JS.
- **Never trust the client for money or access.** Prices come from Stripe Price IDs. Entitlements come from webhooks. Redirect URLs come from a server allowlist.
- **Never store secrets in retrievable form.** Passwords, tokens, and codes go in only in hashed/single-use form. Audit logs redact by policy, not by convention.
- **RLS is the perimeter.** UI guards are UX, not security. Assume the client is hostile.
- **Consistent authz responses.** 401 for unauthenticated, 403 for authenticated-without-permission, 404 only for genuinely missing resources — and never leak which is which through timing or body shape.
- **Idempotency-by-design** for every write path that a network retry could touch.
- **Rate-limit every unauthenticated (and every AI-touching) endpoint.**

## D.4 Open Questions (needed before implementation)

1. Full current RLS policy set for `profiles`, `curriculum_lessons`, `lessons`, `modules`, `weeks`, `courses`, `lesson_resources`, `curriculum_settings`, `evidence_events`, `chat_messages`, `chat_channels`, `entitlements`, `subscriptions`, `admin_audit_log`. (Use `supabase--read_query` on `pg_policies`.)
2. Full `GRANT` set on `public` tables and on all `SECURITY DEFINER` functions.
3. Presence and definition of all unique constraints, FKs, and cron schedules.
4. Full source of every edge function not shown in context (`create-checkout-session`, `create-billing-portal`, `create-payment-intent`, `help-me-now`, `check-user-eligible`, `admin-*`, `zapier-provision-user`, `send-verification-code`, `verify-code-set-password`, `auth-email-hook`).
5. Public-facing preview / marketing URLs that currently link into `curriculum-files` (so we don't break them when flipping the bucket).
6. Confirmation of whether any past `temp_password` values have been exported, shared, or logged anywhere outside the DB.
7. Deployment pipeline — how env vars are set per environment, and whether `.env.development` is currently reachable in production builds.

## D.5 Risk Register

| # | Issue | Severity | Likelihood | Impact | Priority |
|---|-------|----------|------------|--------|----------|
| 1 | Paid content readable via API | Critical | High | Revenue loss, brand | P0 |
| 2 | Paid media downloadable from public bucket | Critical | High | Revenue loss, mass mirror | P0 |
| 3 | Unauthenticated AI endpoint | Critical | High | Runaway cost, abuse | P0 |
| 4 | Plaintext temp passwords in DB | Critical | Medium | Full credential compromise | P0 |
| 5 | All users' PII readable by any user | Critical | High | Mass PII breach | P0 |
| 6 | Dev auth bypass in prod bundle | High | Low-Medium | Total app open | P0 |
| 7 | Definer functions lack input validation | Medium | Medium | Escalation surface | P1 |
| 8 | Draft program settings public | Low-Medium | Medium | Strategic leak | P1 |
| 9 | Audit log stores excessive PII | Medium | Medium | Breach magnifier | P1 |
| 10 | Account-existence enumeration | Medium | High | Phishing prep | P1 |
| 11 | Chat lacks input sanitization | Medium-High | Medium | Stored XSS if HTML-rendered | P1 |
| 12 | Draft week structure public | Low-Medium | Medium | Strategic leak | P1 |
| 13 | Open redirect via returnUrl | Medium | Medium | Phishing | P1 |
| 14 | PUBLIC can EXECUTE definer fn | Medium-High | Medium | Data/side-effect leak | P1 |
| 15 | HIBP disabled | Medium | High | Credential stuffing | P1 |
| 16 | Authenticated can EXECUTE admin definer fn | Medium-High | Medium | Privilege escalation | P1 |
| 17 | Public bucket LIST | High (folded into #2) | High | Enumeration | P0 |
| B1 | Refund/dispute not revoking access | High | Medium | Revenue leak, unpaid access | P2 |
| B2 | Trial silently converts to lockout | High | High | Churn, support load | P2 |
| B3 | Webhook idempotency race | Medium | Low | Duplicate side effects | P2 |
| B7 | Error detail leakage | Medium | Medium | Recon aid | P2 |
| B10 | Cleanup job unscheduled | Medium | High | Stale entitlement state | P2 |
| B11 | Missing DB constraints | Medium | Medium | Invalid states | P2 |
| B15 | No rate limiting | Medium-High | High | Abuse, DoS, brute force | P2 |

---

## Final note

This report is analysis and planning only. No files, migrations, RLS policies, edge functions, or configuration have been changed. Implementation should begin only after the client sign-off on the P0 batch and after the Open Questions in D.4 are answered against the live codebase.
