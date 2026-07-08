# ADR 0002 — Store user roles in a dedicated `user_roles` table checked by `has_role`

- **Status:** Accepted
- **Date:** 2026-01-20

## Context
The app has three tiers of access: regular users, moderators (chat), and admins (curriculum, users, billing). A naive design stores the role on `profiles.role`, but that pattern has three fatal flaws:

1. **Privilege escalation.** If any RLS policy or edge function ever exposes an UPDATE path on `profiles`, a user can promote themselves.
2. **RLS recursion.** Policies that need to check "is admin?" would recursively hit the same table they protect.
3. **Multiple roles.** A single user may hold more than one role.

## Decision
Model roles as `public.user_roles(user_id, role app_role)` with a `unique(user_id, role)` constraint. Introduce a `SECURITY DEFINER STABLE` function `public.has_role(_user_id uuid, _role app_role)` with `SET search_path = public`. Every RLS policy that needs an admin/moderator check calls `has_role(auth.uid(), 'admin')`.

Grants:
- `SELECT` on `user_roles` to `authenticated` only (never `anon`).
- `EXECUTE` on `has_role` to `authenticated` and `service_role`; revoked from `anon` and `public`.

## Alternatives considered
- **Column on `profiles`.** Rejected: privilege escalation risk; violates the platform's explicit "never store roles on profiles" rule.
- **JWT claim.** Rejected: cannot be revoked without token rotation; harder to audit.
- **View joining users and roles.** Rejected: still requires DEFINER to bypass recursion.

## Consequences
**Positive**
- Impossible for a user to update their own role via any client-side path (no policy grants UPDATE).
- `has_role` avoids RLS recursion because DEFINER runs as the function owner.
- Multi-role users are trivially supported.

**Negative**
- Every role check is a function call; requires DEFINER discipline (typed params, pinned search_path, no dynamic SQL).
- Bootstrapping the first admin requires an out-of-band mechanism (`ADMIN_EMAILS` secret + trigger/migration).

**Neutral**
- All future role-gated policies must remember to call `has_role` — enforced by code review, not the schema.

## References
- Migrations creating `app_role`, `user_roles`, and `has_role`.
- Memory: `mem://auth/admin-roles-and-bootstrap`
- Platform directive: `<user-roles>` in the agent knowledge base.