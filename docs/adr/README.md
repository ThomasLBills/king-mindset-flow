# Architecture Decision Records

This directory contains ADRs for Liberated Kings. Each ADR documents one significant technical choice, the context that forced the decision, the alternatives that were considered, and the consequences we accept.

## Format

Each record uses the following headings:

1. **Title** — short noun phrase.
2. **Status** — Proposed / Accepted / Deprecated / Superseded by ADR-XXX.
3. **Date** — ISO date of the decision.
4. **Context** — the forces at play: business, user, technical, regulatory.
5. **Decision** — the choice made, in active voice.
6. **Alternatives considered** — options rejected and why.
7. **Consequences** — positive, negative, and neutral outcomes we accept.
8. **References** — links to code, migrations, tickets, docs.

## Index

| # | Title | Status |
| --- | --- | --- |
| [0001](0001-lovable-cloud-supabase-backend.md) | Use Lovable Cloud (Supabase) as the sole backend | Accepted |
| [0002](0002-roles-in-separate-table.md) | Store user roles in a dedicated `user_roles` table checked by `has_role` | Accepted |
| [0003](0003-entitlement-based-paywall.md) | Gate paid features by `entitlements`, not by Stripe subscription state | Accepted |
| [0004](0004-realtime-postgres-changes-only.md) | Use only `postgres_changes` for realtime; no Broadcast/Presence | Accepted |
| [0005](0005-public-signup-disabled.md) | Disable public sign-up; provision via Stripe, Zapier, or admin invite | Accepted |
| [0006](0006-chat-files-storage-model.md) | Private `chat-files` bucket with user-scoped upload paths and membership-gated reads | Accepted |
| [0007](0007-dev-auth-bypass-hardening.md) | Multi-layer hardening of `VITE_DEV_BYPASS_AUTH` | Accepted |
| [0008](0008-stripe-return-url-allowlist.md) | Enforce returnUrl origin allowlist in Stripe edge functions | Accepted |
| [0009](0009-admin-impersonation.md) | Admin user impersonation via session swap | Accepted |