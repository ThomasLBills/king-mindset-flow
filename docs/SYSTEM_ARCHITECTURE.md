# Liberated Kings — System Architecture

## Overview
This document describes the current production architecture of the Liberated Kings platform and identifies recommended future additions for scale.

---

## Current Stack (Production Today)

```text
┌─────────────────────────────────────────┐
│  Client (React + Vite + Tailwind CSS)   │
│  • Hosted on Lovable / Vercel           │
│  • SPA with PWA capabilities            │
└─────────────────┬───────────────────────┘
                  │ HTTPS / REST / WebSocket
                  ▼
┌─────────────────────────────────────────┐
│  Supabase Platform                      │
│  • Auth (JWT, OAuth, MFA-ready)         │
│  • PostgreSQL (primary datastore)       │
│  • Row-Level Security (RLS)             │
│  • Edge Functions (Deno)                │
│  • Realtime (WebSocket broadcast)       │
│  • Storage (avatar/chat file buckets)   │
└─────────────────────────────────────────┘
```

### Components
| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18, Vite 5, Tailwind CSS v3, Framer Motion | UI / client runtime |
| State & Queries | TanStack Query (React Query) | Server state caching, background refetch |
| Backend / Auth | Supabase (managed) | Auth, Postgres, Realtime, Edge Functions, Storage |
| Database | PostgreSQL 15 (via Supabase) | All relational data, RLS policies |
| Edge Functions | Deno | Webhooks (Stripe), Zapier provisioning, custom email, admin RPCs |
| Storage | Supabase Storage | Chat files, user avatars |
| Payments | Stripe (via Edge Function webhooks) | Subscriptions, trials, entitlements |
| Email | Resend (via Edge Function) | Transactional / auth emails |

---

## Future Scale Recommendations

The following are **not implemented today**. They are architecture recommendations for when traffic, database size, or real-time load grows beyond a single managed Postgres instance.

| Service | Role | When to Add |
|---------|------|-------------|
| **Redis** (e.g. Upstash, Redis Cloud, or AWS ElastiCache) | Session caching, rate-limiting store, Realtime presence deduplication, short-lived feature flags | > 1,000 concurrent Realtime connections; need sub-10ms session reads; or when Postgres CPU is > 70% sustained on auth/session lookups |
| **Sentry** (or comparable: LogRocket, Datadog RUM) | Error tracking, performance monitoring, release health | After public launch; essential before scaling marketing spend or paid acquisition |
| **Read Replicas** (Supabase or self-managed Postgres) | Offload analytics/reporting queries away from primary | When reporting/dashboard queries visibly slow user-facing transactions |
| **CDN / Edge Cache** (Vercel Edge, Cloudflare) | Static asset caching, aggressive API response caching for public content | Global user base; high LCP scores needed |

---

## Data Flow Summary

1. **User signs in / up** → Supabase Auth (PostgreSQL `auth` schema)
2. **App data** → Supabase client library → PostgreSQL `public` schema (RLS-enforced)
3. **Chat / Realtime** → Supabase Realtime channels (Postgres changes + broadcast)
4. **Stripe events** → Stripe → Supabase Edge Function → update entitlements in PostgreSQL
5. **Zapier provisioning** → Zapier webhook → Supabase Edge Function → create user + temp password
6. **File uploads** → Supabase Storage (chat-files bucket, RLS policies)
7. **Emails** → App-triggered → Supabase Edge Function → Resend API

---

## Scaling Concerns & Mitigations

| Concern | Current Mitigation | Future Mitigation |
|---------|-------------------|-------------------|
| Postgres slow queries | RPCs use `count(*)`, indexed `user_id` lookups; TanStack Query caching | Read replicas for analytics; connection pooling review |
| Chat file storage growth | RLS policies restrict access; no public URLs | Lifecycle policies (auto-archive old chat files to cold storage) |
| Realtime channel saturation | Channel-level filtering, no global subscriptions | Redis presence layer; channel sharding by org/room |
| Auth throughput | Supabase managed auth | Redis session cache to reduce DB auth round-trips |
| Error visibility | Console logs; manual user reports | Sentry integration for automatic error capture and release correlation |

---

## Decision Log

- **Stay on Supabase managed platform** — reduces ops overhead; all data stays in one Postgres instance with RLS.
- **No Redis today** — no sustained high-frequency read patterns that outpace Postgres + query caching.
- **No Sentry today** — pre-launch; error volume is low and manually trackable.
- **Edge Functions over external API layer** — keeps auth context native to Supabase; simplifies RLS enforcement.
