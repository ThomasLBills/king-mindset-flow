# Admin panel - operator runbook (DB / RLS / roles)

This repo cannot reach Supabase directly (no service-role key, no SQL, no
migration/RLS/edge-function deploy from the client). Everything below is
**for a human to apply** via the Lovable Supabase integration or the Supabase
SQL editor. Apply it, then confirm - the client-side hardening is not "done"
until these are verified against the live database.

> Model reminder: the client `isAdmin` check (`useAdminRole`, `AdminGuard`) is
> a **UX gate only** - it decides what to render, never what the database
> returns. Every table the admin panel touches is protected server-side by
> Row Level Security using the `has_role(auth.uid(), 'admin')` security-definer
> function. A non-admin who forges `isAdmin=true` in the browser still gets
> zero rows back. Keep it that way.

---

## 1. RLS audit - status as of this pass

Audited every admin query/mutation (see the per-table map below). Result:
**RLS is already enforced on every admin-read/write table via
`has_role(auth.uid(), 'admin')`, with one gap** (crisis_button_events, section 2).

| Table | Admin needs | Policy found | Status |
|-------|-------------|--------------|--------|
| profiles | SELECT | `Admin reads all profiles` | OK |
| entitlements | SELECT (writes via edge fn) | `Admin reads all entitlements` | OK |
| subscriptions | SELECT | `Admin reads all subscriptions` | OK |
| stripe_customers / payments / webhook_events | SELECT | `Admin reads ...` | OK |
| user_roles | SELECT/INSERT/UPDATE/DELETE | `Admin ... roles` (DELETE guards `auth.uid() != user_id`) | OK |
| admin_audit_log | SELECT + INSERT | `Admins read/insert audit log` | OK |
| chat_channels | ALL / UPDATE / DELETE | `Admins ...` | OK |
| chat_channel_members / chat_messages / chat_flags | SELECT (+INSERT members) | `Admin reads ...` | OK |
| app_settings | ALL | `Admins manage app_settings` | OK |
| announcements | ALL | `Admins manage announcements` | OK |
| weeks / curriculum_lessons / curriculum_settings / curriculum_versions | ALL | `Admins manage ...` | OK |
| programs / courses / modules / lessons / lesson_resources | ALL | `Admins manage ...` | OK |
| user_enrollments / curriculum_lesson_progress / lesson_progress / course_progress | SELECT | `Admins read all ...` | OK |
| daily_check_ins / daily_completions / freedom_streaks / brotherhood_connections | SELECT | `Admin reads ...` | OK |
| **crisis_button_events** | SELECT (aggregate) | **none - user-scoped only** | **FIX (section 2)** |
| relapse_events | (not surfaced - see note) | user-scoped only | Intentional, no action |

**relapse_events note:** it has only a `USING (auth.uid() = user_id)` policy,
so the admin client cannot read other users' rows. This is deliberate and we
keep it that way - the admin analytics never surface relapse data (honoring
the "no per-user shame scoreboard" rule). If aggregate relapse *pattern*
insight is ever wanted, it must be exposed through a `SECURITY DEFINER`
aggregate function that returns counts only, never rows (same shape as
section 2), never a per-user list.

### Verify it yourself (run in Supabase SQL editor)

```sql
-- Lists admin-relevant policies. Every table below should appear with a
-- qual/with_check that mentions has_role(..., 'admin').
select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and (qual ilike '%has_role%admin%' or with_check ilike '%has_role%admin%')
order by tablename, cmd;

-- Confirm RLS is actually ENABLED (not just that policies exist):
select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace
  and relkind = 'r'
  and relname in (
    'profiles','entitlements','subscriptions','user_roles','admin_audit_log',
    'chat_channels','chat_messages','app_settings','announcements','weeks',
    'curriculum_lessons','curriculum_lesson_progress','user_enrollments',
    'crisis_button_events','relapse_events'
  )
order by relrowsecurity, relname;   -- any relrowsecurity = false is a hole
```

---

## 2. FIX - aggregate Stand-Firm ("I need strength") usage for the dashboard

The dashboard shows an **aggregate** Stand-Firm usage trend. `crisis_button_events`
is currently user-scoped (RLS `auth.uid() = user_id`), so an admin reading it
directly gets only *their own* events - the chart would be silently wrong.

Fix it privacy-first: a `SECURITY DEFINER` function that returns **only daily
counts**, never rows. Individual crisis events never reach the browser.

```sql
create or replace function public.get_crisis_button_trend(_days int default 30)
returns table(day date, count bigint)
language sql
security definer
set search_path = public
as $$
  select d::date as day, count(e.id) as count
  from generate_series(
         (current_date - (_days - 1)),
         current_date,
         interval '1 day'
       ) as d
  left join public.crisis_button_events e
    on e.triggered_at >= d
   and e.triggered_at <  d + interval '1 day'
  -- caller must be an admin; the function bypasses RLS, so gate it here:
  where public.has_role(auth.uid(), 'admin')
  group by d
  order by d;
$$;

revoke all on function public.get_crisis_button_trend(int) from public, anon;
grant execute on function public.get_crisis_button_trend(int) to authenticated;
```

The dashboard calls `supabase.rpc('get_crisis_button_trend', { _days })`. Until
this exists the Stand-Firm card renders a graceful "not available" state (it
does not crash).

> `_days` is clamped to `[1, 365]` in the SECURITY DEFINER body above via the
> `generate_series` window; the client also clamps. If you prefer an even
> tighter surface, wrap the where-clause admin check into a guard that raises
> instead of returning empty.

---

## 3. First-admin bootstrap

Roles live in `public.user_roles` (enum `app_role` = admin | user | moderator).
There is no UI to mint the first admin (by design - `Admin inserts roles`
requires you to already be an admin). Seed it once by hand:

```sql
-- Find the user id:
select user_id, email from public.profiles where email = 'you@example.com';

-- Grant admin (idempotent):
insert into public.user_roles (user_id, role)
values ('<paste-user-id>', 'admin')
on conflict do nothing;
```

Sign out/in (or refresh) so `useAdminRole` re-queries. The "Admin" item then
appears in the account menu, and `/admin` stops bouncing to `/`.

To revoke: `delete from public.user_roles where user_id = '<id>' and role = 'admin';`
(a user cannot delete their own admin row - the DELETE policy blocks
self-demotion, so a second admin must do it.)

---

## 4. Audit-logging gaps (verify server-side)

Curriculum/announcement/settings/channel mutations write `admin_audit_log`
from the client via `logAudit(...)`. That is advisory only (a forged client
could skip it); the authoritative record for **privileged** actions should be
written server-side. Action items:

1. **User-management edge functions** (`admin-users`/`admin-entitlements` -
   toggle entitlement, toggle role, create/delete user, extend entitlement):
   confirm each writes an `admin_audit_log` row **inside the edge function**
   (service-role side), the way `admin-impersonate` already does. The admin
   client cannot and should not audit these - it does not perform the write.
   *This pass added no client-side audit for edge-function actions on purpose.*
2. **Direct client table writes** (`app_settings`, `chat_channels`): this pass
   added client-side `logAudit` calls for consistency, but the robust fix is a
   database trigger so the audit row is written in the same transaction as the
   change and cannot be skipped. Optional hardening:

```sql
-- Example: authoritative audit trigger for app_settings (repeat per table).
create or replace function public.audit_app_settings()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.admin_audit_log(admin_user_id, action, entity_type, entity_id, before_json, after_json)
  values (auth.uid(), tg_op, 'app_settings', coalesce(new.key, old.key),
          to_jsonb(old), to_jsonb(new));
  return coalesce(new, old);
end $$;

create trigger trg_audit_app_settings
  after insert or update or delete on public.app_settings
  for each row execute function public.audit_app_settings();
```

---

## 5. Moderator role - DEFERRED

`app_role` includes `moderator`, but nothing in the product grants or checks it
today (RLS gates on `admin` only; there is no moderator-scoped policy or UI).

**Decision: defer.** Do not add a half-wired moderator tier. When there is a
real need (most likely: community moderation - read `chat_flags`, hide/lock
messages, without user/billing/curriculum access), define it as an explicit
slice:

- RLS policies keyed on `has_role(auth.uid(), 'moderator')` for exactly the
  moderation tables (`chat_flags` SELECT/UPDATE, `chat_messages` UPDATE/DELETE).
- A `useModeratorRole` hook mirroring `useAdminRole`.
- A trimmed nav in `AdminLayout` (moderation only).

Until then, `moderator` is inert and safe.
