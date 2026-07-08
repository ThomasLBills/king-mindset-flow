# Product Requirements Document — Liberated Kings

**Status:** Living document
**Owner:** Product / Founder
**Last updated:** 2026-07-08
**Version:** 1.0

---

## 1. Overview

### 1.1 Product summary
Liberated Kings is a Christ-centered men's discipleship and recovery app focused on freedom from sexual sin, spiritual formation, and brotherhood. It replaces willpower-based sobriety trackers with grace-first tools: scripture, prayer, a daily armor practice, a moderated brotherhood, and an 8-week guided workbook.

### 1.2 Vision
Every Christian man walking in freedom, rooted in his identity as a son, supported by real brothers, and formed by daily practice — not shame, streak counters, or clinical language.

### 1.3 Mission (this release)
Deliver a mobile-first, dark, masculine app that:
- Gets a man out of an urge in under 60 seconds.
- Gives him one clear next practice every day.
- Connects him to real brothers he can message privately.
- Walks him through an 8-week workbook that unlocks on a time-based drip.
- Never shames him, never asks him to earn God's approval.

### 1.4 Success metrics
| Metric | Target (90 days post-launch) |
| --- | --- |
| Weekly active users / paid users | ≥ 60% |
| Trial → paid conversion | ≥ 25% |
| Users completing week 1 of workbook | ≥ 70% of active |
| Median "urges redirected" events per active user / week | ≥ 3 |
| Brotherhood accepted connections per active user | ≥ 1 |
| Crash-free sessions | ≥ 99.5% |
| Support tickets per 100 users / month | ≤ 3 |

---

## 2. Users & audience

### 2.1 Primary persona — "The Fighting Believer"
- Christian man, 22-55, on his phone daily.
- Has tried multiple recovery apps; bounced off shame-based or clinical tools.
- Reads Scripture but struggles to apply it in the heat of temptation.
- Wants privacy: the app must not look or sound like porn recovery software on his home screen or notifications.

### 2.2 Secondary personas
- **The Brother** — a peer supporter, uses DMs and channels to encourage.
- **The Admin (staff)** — publishes workbook content, provisions users, moderates chat.
- **The Coach (future)** — small-group leader (out of scope for v1).

### 2.3 Non-users
- Women (out of scope).
- Users under 18.
- Clinical/therapeutic use — the app is discipleship, not treatment.

---

## 3. Problem & context

### 3.1 Problem
Existing recovery apps rely on streaks, shame, and productivity tracking. When a man relapses, the streak resets to zero and the app punishes him. This drives churn and reinforces the lie that identity is performance-based.

### 3.2 Why now
- Access to porn is universal and mobile.
- Church-adjacent digital tools remain clinical or juvenile.
- Stripe + Lovable Cloud make a subscription-gated, secure, mobile-first PWA shippable by a lean team.

### 3.3 Constraints & non-negotiables
- **Brand voice** must stay calm, masculine, grounded, grace-first, non-clinical.
- **No shame mechanics** — no red streak counters, no failure screens.
- **Discreet on device** — generic notifications, panic-close, optional app lock.
- **Scripture is ESV**.
- **Public sign-up is disabled** — accounts are provisioned through Stripe/Zapier or admin invite. `/login` is the only public auth entry.

---

## 4. Scope

### 4.1 In scope (v1)
- Auth: password + 6-digit code fallback; temp-password flow for provisioned users; forgot-password.
- Home dashboard with the day's practice and personal metrics.
- Armor tab: 5 in-the-moment tools (Scripture, Prayer, Grace Protocol, Spirit-Led Crisis, Declarations).
- Brothers tab: search, connect, mutual accept, DMs, channels, reactions, image uploads, Liberated Sessions read-only channel.
- Path tab: 8-week workbook, time-based unlock, lesson progress, 12 block types.
- Faith micro-practices: rotating daily Prayer / Scripture / Renewed Mind.
- Daily check-in (emotion selection).
- Pillars tracker (Faith / Connection / Fitness).
- Community stats (this week, engaged users, all-time).
- Subscription: 60-day free trial entitlement, Stripe checkout + billing portal.
- Admin console: user management, curriculum CMS, engagement analytics, audit log.
- PWA install, offline navigation fallback.

### 4.2 Out of scope (v1)
- Native iOS/Android apps.
- Group video, coaching sessions, live events.
- AI companion beyond the single `help-me-now` prompt.
- Financial or productivity tracking.
- Localization (English-only for launch).
- Anonymous / social sign-in.

### 4.3 Explicit non-goals (memory-enforced)
- Floating gold shield button.
- Pattern Detection / Insight cards.
- Public sign-up form.
- Serif fonts in recovery tools.
- The word "coursebook" (always "Workbook").
- Em-dashes and the word "but" in recovery tools.

---

## 5. Feature requirements

### 5.1 Authentication & accounts
- Login by email + password.
- 6-digit code fallback for mobile in-app browsers.
- PKCE (`?code=`) flow for email OTP so links survive in-app browser stripping.
- Temp passwords issued by admin/Zapier are nullified in `profiles` upon successful password set.
- Forgot password: if the user has never set a password, resend invite instead of a reset.
- Public sign-up disabled at both UI and Auth-provider level.
- Google OAuth provisioned as the only social option, with `redirect_uri = window.location.origin`.
- HIBP leaked-password check enabled.

### 5.2 Home dashboard
- Personal metrics (side-by-side cards): urges redirected, days engaged.
- Today's practice card linking into Faith.
- Community stats block (weekly and all-time, Central Time reset).
- Tapping the active bottom-nav icon scrolls to top.

### 5.3 Armor tab
Five left-aligned cards:
1. **Scripture** — ESV verse cycling, categorized by trigger (Temptation, Shame, Fatigue, Loneliness, Stress).
2. **Prayer** — guided prompts.
3. **Grace Protocol (RETURN)** — 6-step recovery flow, randomized declarations, private trace notes.
4. **Spirit-Led Crisis Flow** — 3 steps, awards +1 "urge redirected" evidence.
5. **Personal Declarations** — CRUD identity statements.

Interaction rules:
- Hold-to-confirm on recovery actions: 2000 ms left-to-right gold fill.
- Brief full-screen confirmation returning to Home/Armor after logging.

### 5.4 Brothers tab (community & chat)
- Landing view = channels list; DMs secondary tab.
- Search excludes already-connected brothers; enforces a `max_brothers` cap.
- Brotherhood connection: request → recipient accepts → mutual bond; either party can remove.
- Chat: channels + 1:1 DMs. Text + image attachments (10 MB max).
- Uploads scoped to `chat-files/<auth.uid()>/…`; reads gated by channel/DM membership.
- Reactions: 40×40 touch targets, instant emoji picker.
- Unread badges from `chat_read_cursors`.
- Auto-scroll on new messages via MutationObserver.
- "Liberated Sessions" is a read-only pinned admin channel enforced in both UI and RLS.
- Realtime deletes via `REPLICA IDENTITY FULL`.
- Admin controls: delete any message, pin, moderate.

### 5.5 Path tab (workbook)
- 8-week curriculum, time-based drip from enrollment date.
- Lesson list with locked/unlocked states, indentation, and completion icons.
- 12 content block types (video, audio, scripture, reflection, prompt, checklist, quote, image, etc.).
- Progress tracked at lesson + week + course level.
- Vimeo embeds via URL hash extraction, mobile-optimized.

### 5.6 Faith micro-practices
- Rotating daily content: Prayer / Scripture / Renewed Mind.
- No-backlog rotation: one update per calendar day, local timezone.
- Renewed Mind: 3-step reframing (Identify → Evaluate → Replace).

### 5.7 Daily check-in & Pillars
- One-tap emotion selection; "Angry" surfaces first.
- Pillars: Faith, Connection, Fitness — daily checklists in `daily_completions`.

### 5.8 Subscription & billing
- 60-day free trial entitlement granted at signup via `handle_new_user` trigger.
- Stripe checkout: allowlisted `returnUrl` origins only.
- Stripe billing portal: same allowlist enforcement.
- Webhook (`verify_jwt=false`) reconciles entitlements, trials, and subscription state.
- Zapier provisioning path creates users with temp passwords + 60-day trial.
- Entitlement checks use UTC absolute comparisons; session is refreshed before paywall gating to avoid loops.

### 5.9 Admin console
- User management: paginated list, client-side "ping" for last seen, RPC counts, roles filter.
- Curriculum CMS: draft → publish workflow, categorized "+ Add Content Block" menu, 12 block types.
- Engagement analytics: completion rate scoped to active learners only.
- Audit log: all admin curriculum/content modifications recorded to `admin_audit_log` (100 KB payload cap).
- Full user deletion path.

### 5.10 AI assistant (`help-me-now`)
- Single-turn, 2-4 sentence, grace-first responses using Lovable AI Gateway (Gemini 2.5 Flash).
- Requires authenticated Bearer token; returns 401 otherwise.
- Safety rule: on self-harm mention, direct user to 988 / local emergency services.

---

## 6. UX & design requirements

- **Palette:** dark charcoal `#1A1A1A` / `#242424`, gold accent `#B8963F`, text `#F5F3EE`.
- **Type:** sans-serif for recovery tools (no italics); no default AI fonts (Inter/Poppins) without intent.
- **No global focus rings or heavy shadows.**
- **Mobile-first:** viewport `user-scalable=no`, safe-area insets, responsive full-screen modals.
- **Bottom nav:** Home, Armor, Brothers, Path (in that order), opacity states for active/inactive.
- **Discretion:** brand icon and PWA name generic-friendly; notifications generic.
- **Legal pages** (`/terms`, `/privacy`) use `@tailwindcss/typography` `prose`.

---

## 7. Non-functional requirements

### 7.1 Security
- Roles in dedicated `user_roles` table, checked via `has_role` SECURITY DEFINER.
- RLS enabled on every public table; GRANTs match the policy set.
- Storage: `chat-files` bucket private, path-scoped by user id, read-gated by channel/DM membership.
- Edge functions validate JWTs in code via `getClaims()`; webhooks validate signatures.
- CSP allows `frame-src` for `player.vimeo.com`.
- Dev auth bypass hardened: build-time literal + `MODE==='production'` + localhost hostname gate.
- HIBP leaked-password check on.
- Account-enumeration surfaces (check-user-eligible, send-verification-code) return uniform responses.
- Stripe checkout/portal `returnUrl` validated against origin allowlist.

### 7.2 Performance
- Chat fetch: 100 most recent messages, reversed client-side.
- Vite PWA precache excludes files > 3 MB.
- Image uploads capped at 10 MB with placeholder pulse UI.

### 7.3 Reliability
- Realtime channel joined before message fetch/subscription.
- Query cache invalidation on onboarding completion.
- Subscription check refreshes session before entitlement gate.

### 7.4 Accessibility
- Minimum 40×40 px touch targets on interactive icons.
- Sufficient contrast on charcoal + gold palette.
- Whitespace-preserving message rendering.

### 7.5 Privacy
- Discreet app presence, local app lock, panic close.
- Generic push/system notifications.
- Admin audit payloads capped at 100 KB.

---

## 8. Data model (high level)
Key tables in `public`:
- `profiles`, `user_roles`, `entitlements`, `subscriptions`, `stripe_customers`, `payments`, `plans`
- `chat_channels`, `chat_channel_members`, `chat_dms`, `chat_messages`, `chat_reactions`, `chat_read_cursors`, `chat_flags`
- `brotherhood_connections`
- `weeks`, `curriculum_lessons`, `curriculum_lesson_progress`, `curriculum_settings`, `curriculum_versions`, `user_enrollments`, `lessons`, `lesson_progress`, `lesson_resources`, `courses`, `modules`, `programs`, `course_progress`
- `daily_check_ins`, `daily_completions`, `evidence_events`, `freedom_streaks`, `gratitude_entries`, `user_action_items`, `user_declarations`, `user_journal_entries`, `crisis_button_events`, `relapse_events`
- `announcements`, `app_settings`, `admin_audit_log`, `webhook_events`, `edge_rate_limits`, `verification_codes`, `yield_logs`, `pattern_insights`

---

## 9. Integrations
- **Lovable Cloud (Supabase)** — Postgres, Auth, Storage, Edge Functions, Realtime.
- **Stripe** — subscriptions, checkout, billing portal, webhook.
- **Zapier** — external user provisioning to `zapier-provision-user`.
- **Resend** — transactional email (verification code, invites).
- **Lovable AI Gateway** — Gemini 2.5 Flash for `help-me-now`.
- **Vimeo** — video hosting for curriculum.

---

## 10. Rollout & operations

### 10.1 Environments
- Preview: `id-preview--…lovable.app`
- Published: `king-mindset-flow.lovable.app`
- Custom domain: `app.liberatedkings.com`

### 10.2 Release strategy
- Trunk-based; migrations reviewed before apply.
- No native app store submission for v1.

### 10.3 Support
- Support email: `hello@liberatedkings.com`.
- Admins can provision, disable, or delete users manually.

---

## 11. Open questions
1. Do we want a super-admin role separate from admin for audit-log access?
2. Should we introduce content filtering for chat messages beyond length/URL checks?
3. Roadmap: coach role, group calls, native shell — sequence and timing.
4. Data retention policy for `admin_audit_log` and `evidence_events`.

---

## 12. Appendix — glossary
- **Armor** — the in-the-moment recovery toolset.
- **Workbook** — the 8-week guided curriculum (never "coursebook").
- **Urges Redirected** — the primary evidence metric (never "urge calculator").
- **Grace Protocol / RETURN** — the 6-step post-slip recovery flow.
- **Liberated Sessions** — read-only admin broadcast channel.
- **Pillars** — Faith, Connection, Fitness daily checklists.