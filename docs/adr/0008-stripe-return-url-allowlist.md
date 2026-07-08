# ADR 0008 — Enforce returnUrl origin allowlist in Stripe edge functions

- **Status:** Accepted
- **Date:** 2026-07-08

## Context
`create-checkout-session` and `create-billing-portal` accept a `returnUrl` in the request body and pass it through as Stripe's `success_url`, `cancel_url`, and `return_url`. Without validation, an authenticated caller can craft a checkout or portal URL that redirects the victim to any external domain after a legitimate Stripe interaction — a classic open-redirect via a trusted Stripe URL.

The severity is higher for checkout than portal because the checkout link is not bound to the caller's Stripe customer and can be sent to a victim.

## Decision
Both functions maintain a hardcoded allowlist of production origins and validate `returnUrl` against it before handing it to Stripe:

```ts
const ALLOWED_ORIGINS = [
  "https://app.liberatedkings.com",
  "https://king-mindset-flow.lovable.app",
];
```

If the parsed origin is not in the allowlist, the function silently falls back to `https://app.liberatedkings.com` (checkout uses just the origin; portal uses the canonical `/billing` URL). Malformed URLs also fall back rather than 400, to avoid a distinguishable error signal.

## Alternatives considered
- **Reject with HTTP 400 on invalid origin.** Rejected: leaks that validation exists, aids an attacker probing the endpoint. Silent fallback is safer.
- **Ignore caller `returnUrl` entirely and always use the hardcoded canonical URL.** Considered acceptable and equivalent in security; kept the allowlist to allow the preview domain during QA.
- **Read the caller's `Origin` header.** Rejected: not reliable across in-app browsers.

## Consequences
**Positive**
- Neither endpoint can be turned into an open-redirect gadget via Stripe.
- Adding a new legitimate origin (e.g. a new custom domain) is a two-line change.

**Negative**
- Requires syncing the allowlist across both functions when domains change.

**Neutral**
- QA against arbitrary preview URLs must go through the preview allowlisted origin, not per-branch subdomains.

## References
- `supabase/functions/create-checkout-session/index.ts`
- `supabase/functions/create-billing-portal/index.ts`
- Security findings: `checkout_open_redirect`, `billing_portal_open_redirect` (both marked fixed 2026-07-08).