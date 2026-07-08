# ADR 0005 — Disable public sign-up; provision via Stripe, Zapier, or admin invite

- **Status:** Accepted
- **Date:** 2026-02-20

## Context
Liberated Kings is a paid product with a 60-day trial granted only through vetted acquisition paths (Stripe checkout, Zapier automation from marketing funnels, admin invite for cohort launches). Allowing anonymous sign-up would:
- Let scrapers or bots create thousands of accounts, burning AI credits on `help-me-now`.
- Muddy analytics (WAU, trial → paid conversion).
- Expose the entitlement grant path to abuse (60 free days per email address).

## Decision
Turn off public sign-up at the Auth provider level (`disable_signup=true`) and hide the sign-up form in the UI. `/login` is the only public auth entry. All accounts are created via one of:

1. **Stripe checkout** → webhook provisions user + entitlement.
2. **Zapier** → `zapier-provision-user` edge function issues a temp password and 60-day trial.
3. **Admin invite** → `admin-create-user` edge function, temp password emailed via Resend.

Temp passwords are nullified in `profiles` on first successful password set (`verify-code-set-password`).

To avoid account enumeration:
- `check-user-eligible` returns `{ eligible: false }` uniformly.
- `send-verification-code` returns `{ sent: true }` uniformly.

## Alternatives considered
- **Open sign-up with email verification.** Rejected: verification blocks bots weakly; still burns AI credits per confirmed account; complicates entitlement grants.
- **Sign-up only via Google OAuth.** Rejected: same abuse surface; also requires more account plumbing than the acquisition funnels justify.
- **CAPTCHA on sign-up.** Considered a fallback; not needed because sign-up is closed.

## Consequences
**Positive**
- Every account is attributable to a paying, invited, or provisioned source.
- AI credits and trial grants are protected from bulk abuse.
- Simpler auth UI.

**Negative**
- Users who land at the marketing site and want to "just try it" must go through checkout or invite.
- Admins are on the hook to provision manually for edge cases.

**Neutral**
- Forgot-password flow must route users who have never set a password to invite-resend rather than password-reset.

## References
- `supabase/functions/zapier-provision-user`, `admin-create-user`, `verify-code-set-password`, `check-user-eligible`, `send-verification-code`
- Memory: `mem://auth/password-authentication`, `mem://security/temp-password-cleanup`, `mem://features/auth/forgot-password-routing`