
# Plan: Write a full PRD for the Liberated Kings codebase

## Approach

Following the referenced framework (Carlin Yuen, "Writing PRDs and Product Requirements"), a single monolithic doc for an app this size would become the exact anti-pattern the article warns against ("massive documents that people don't read"). Instead, I'll produce **one top-level Product PRD** plus **linked mini Feature PRDs** for each major surface, in one file for easy handoff.

**Deliverable:** `docs/PRD.md` — a single Markdown file with a top-level Product PRD, then feature-PRD sections, then appendix. Table of contents at the top so readers can jump. Roughly 25–40 pages when printed; the top-level Product PRD alone stays in Carlin's recommended 6–8 page range.

If you'd prefer this as a `.docx` (using the docx skill) or split into multiple files under `docs/prd/`, tell me and I'll adjust before writing.

## Document structure

### Part 1 — Product PRD (top-level, ~6–8 pages)

Follows the article's structure exactly:

1. **Problem / Opportunity** — men struggling with compulsive sexual behavior lack a grace-first, non-clinical, spiritually-grounded recovery environment; existing tools are either clinical trackers, shame-inducing streak counters, or generic productivity apps.
2. **Target users & use cases** — Christian men in recovery (primary), invited by an admin or Stripe checkout; secondary: admins/coaches provisioning and moderating.
3. **Current journeys / Landscape** — brief sketch of typical alternatives (accountability apps, secular recovery, in-person groups) and why they fall short for this user.
4. **Proposed solution / Elevator pitch** — 2–3 lines + the 3 MVP value props (daily rhythm, in-the-moment recovery tools, brotherhood accountability) + conceptual model diagram (ASCII: Home → Armor / Path / Brotherhood / Rhythms).
5. **Goals / Measurable outcomes** — 3 bullets (activation into daily use, urges-redirected events per active user, brotherhood connection retention).
6. **MVP / Functional requirements** — bucketed by critical user journey, prioritized P0/P1/P2. High-level only; details deferred to Feature PRDs below.
7. **Appendix** — links to the Feature PRDs, data model, integrations, security posture, known issues.

### Part 2 — Feature PRDs (one mini-PRD per surface)

Each follows the same 7-section skeleton but scoped and shorter (~1–2 pages each):

- **F1. Authentication & onboarding** (Login, Signup-disabled, SetupAccount, ForgotPassword, ChangePassword, ResetPassword, Onboarding, guards, temp password / 6-digit verify flow)
- **F2. Home dashboard** (Freedom strip, calendar, King Profile, week progress, tool cards, daily check-in, urges redirected, armor activated, brotherhood call)
- **F3. Armor & recovery tools** (Grace Protocol, Spirit-Led Crisis, Temptation, Pressure Rising, After Fall, Gratitude, Declarations, Help Me Now AI, Quick Help, Scripture tool, hold-to-confirm interaction)
- **F4. Rhythms / Faith** (Prayer, Scripture, Renewed Mind, daily content rotation)
- **F5. Path / Curriculum** (8-week drip, weeks/modules/lessons, LessonView, signed asset URLs, progress tracking)
- **F6. Library** (browse published content)
- **F7. Brotherhood & Chat** (channels, DMs, brotherhood connections, reach out, reactions, image uploads, realtime, unread counts, Liberated Sessions read-only channel)
- **F8. Profile & billing** (Profile, Billing/Upgrade/ThankYou, Stripe customer portal)
- **F9. Admin console** (Users, Entitlements, Curriculum CMS with 12 block types, Community/Channels, Announcements, Audit log, Settings)
- **F10. Integrations** (Stripe checkout + webhook, Zapier provisioning, Resend transactional email, Lovable AI Gateway for help-me-now, Vimeo video embeds)

### Part 3 — Appendix

- **A1. Data model** — every `public.*` table (from `src/integrations/supabase/types.ts`), storage buckets (`curriculum-files`, `chat-files`), RLS pattern, roles enum.
- **A2. Edge functions catalog** — every function in `supabase/functions/*` with purpose and auth requirement.
- **A3. Routing map** — every route from `src/App.tsx` with guard chain.
- **A4. Non-functional requirements** — PWA/offline, mobile-first, safe-area insets, dark charcoal + gold aesthetic, tone/voice rules, ESV scripture, "Workbook" not "coursebook", React error #290 constraint, viewport `user-scalable=no`.
- **A5. Security posture & known issues** — current guard/RLS model plus the 19 open security scan findings visible in the More panel (grouped by severity, one-line summary + affected file), so the roadmap is honest.
- **A6. Roadmap & out-of-scope** — items intentionally not built (public sign-up, financial tracking, productivity features per brand rules).
- **A7. Glossary** — Workbook, Armor, Path, Brotherhood, Rhythms, Urges Redirected, Liberation Evidence, entitlement, etc.

## Rules I'll follow while writing

- Focus on functionality and user needs, not implementation. No component/file names in the Product PRD body; they live in the appendix.
- Prioritize with **[P0] / [P1] / [P2]** on every requirement line, per the article.
- Bucket by critical user journey, not by screen.
- No em-dashes, use "Workbook" and ESV, keep the tone rules from project memory.
- Cite file paths only in the appendix, using backticks.
- Include the currently-open security findings verbatim (by internal_id + one line) in A5 so the PRD reflects the truthful state of the product.

## What I need from you

Confirm the format (`docs/PRD.md` in this repo, one file). Otherwise I'll proceed as above when you switch me to build mode.
