# ADR 0007 — Multi-layer hardening of `VITE_DEV_BYPASS_AUTH`

- **Status:** Accepted
- **Date:** 2026-06-10, revised 2026-07-08

## Context
During local development it is useful to skip the login flow so engineers can iterate on gated screens without provisioning a full account. A single boolean env var (`VITE_DEV_BYPASS_AUTH=true`) satisfies this need, but any auth bypass shipped to production is catastrophic — it renders every RLS scope moot from the client's perspective.

A single runtime check is not sufficient because:
- Env vars can leak into production `.env` files by accident.
- Localhost tunnels and port-forwarded endpoints can activate a hostname-only gate.
- A runtime-only branch still ships the bypass code in the production bundle.

## Decision
Layer four defenses. The bypass activates only when **all four** pass:

1. **Build-time abort.** `vite.config.ts` throws if `VITE_DEV_BYPASS_AUTH=true` is set for a non-development mode; no bypass artifact can be built for prod.
2. **Build-time literal.** `__DEV_BYPASS__` is injected via Vite `define` as a JSON boolean. In production it is `false`, so every `if (__DEV_BYPASS__)` branch is dead-code-eliminated.
3. **Runtime `MODE` gate.** `isDevBypassEnabled()` short-circuits when `import.meta.env.MODE === 'production'` or `import.meta.env.PROD`.
4. **Runtime hostname gate.** Even in a dev build, the hostname must be `localhost` or `127.0.0.1`.

## Alternatives considered
- **Feature-flag service.** Rejected: adds a network dependency for a dev-only convenience.
- **Separate dev-only auth provider.** Rejected: heavier maintenance than the four-layer gate.

## Consequences
**Positive**
- The bypass cannot ship to production in any realistic misconfiguration.
- Dead-code elimination removes the branch from the production bundle entirely.

**Negative**
- Four layers to reason about; requires a comment block in the source explaining the model.

**Neutral**
- Any future auth touch-up must preserve all four layers.

## References
- `src/lib/devBypass.ts`
- `vite.config.ts`
- Memory: `mem://security/dev-preview-bypass`