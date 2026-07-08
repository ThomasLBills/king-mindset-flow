# ADR 0001 — Use Lovable Cloud (Supabase) as the sole backend

- **Status:** Accepted
- **Date:** 2026-01-15

## Context
Liberated Kings is a mobile-first PWA built by a lean team. It needs auth, a relational database with row-level security, private file storage, background functions for Stripe / AI / provisioning, realtime for chat, and a hosted SMTP/email path. The team is React/TypeScript-only, has no dedicated backend engineer, and needs the app to ship and iterate fast without spinning up servers, VPCs, or container orchestration.

Constraints that shaped this decision:
- Payments and provisioning must happen server-side (Stripe secret key, service role key).
- Data model requires per-user isolation (chat, journal, entitlements, curriculum progress).
- No infrastructure team to manage a bespoke Node/Rails backend.
- The Lovable platform natively integrates one managed backend.

## Decision
Adopt **Lovable Cloud** (managed Supabase) as the single backend for auth, Postgres, storage, edge functions, and realtime. All server logic lives in Deno edge functions under `supabase/functions/*`. The frontend talks to the backend only through the generated Supabase client and typed edge function calls.

## Alternatives considered
- **Own Node.js API + external Postgres.** Rejected: too much operational overhead for the team size; duplicates Auth/Storage/Realtime that Supabase gives for free.
- **Firebase.** Rejected: NoSQL model is a poor fit for the relational curriculum, entitlements, and audit-log requirements; weaker SQL-based RLS story.
- **BYO Supabase project (external).** Rejected: loses managed session injection, secret handling, and one-click provisioning that Lovable Cloud offers.

## Consequences
**Positive**
- Zero-ops for the team; migrations, connection pooling, and backups are managed.
- RLS enables per-user data isolation without an application-layer auth check on every query.
- Edge functions colocated with the database keep latency low.

**Negative**
- Vendor lock-in to Supabase's Postgres extensions and Auth.
- Some managed limits (edge function cold start, storage bandwidth) are opaque.
- Direct DB dumps and `SUPABASE_SERVICE_ROLE_KEY` are not accessible to the user on Lovable Cloud.

**Neutral**
- All schema changes go through the migration tool; ad-hoc DDL is disallowed.

## References
- `src/integrations/supabase/client.ts`
- `supabase/functions/*`
- Memory: `mem://architecture/data-persistence-pattern`