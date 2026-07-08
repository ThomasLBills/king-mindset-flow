# ADR 0004 — Use only `postgres_changes` for realtime; no Broadcast/Presence

- **Status:** Accepted
- **Date:** 2026-02-14

## Context
Chat, unread badges, and moderator actions need live updates. Supabase Realtime offers three modes: `postgres_changes` (row-level DB events under source-table RLS), `broadcast` (arbitrary topic messages, ephemeral), and `presence` (join/leave tracking).

Broadcast and Presence bypass source-table RLS and require topic-scoped policies on `realtime.messages`. Without those policies, any authenticated user could subscribe to any topic.

## Decision
Use **`postgres_changes` exclusively**. Every live-updating surface reads from a table (`chat_messages`, `chat_read_cursors`, `chat_reactions`) and inherits that table's RLS policies automatically. No feature subscribes to a private Broadcast or Presence topic.

To make deletes visible over realtime, `chat_messages` is set to `REPLICA IDENTITY FULL`.

Consequences of this decision:
- We do **not** add RLS policies to `realtime.messages`, because we do not use topics that require them.
- Any future feature that needs Broadcast/Presence must first land topic-scoped policies keyed on `realtime.topic()` and `auth.uid()`.

## Alternatives considered
- **Broadcast for typing indicators / presence.** Deferred: would require net-new realtime authorization work; not worth the scope for v1.
- **Polling.** Rejected: too slow for chat and reactions; wastes battery on mobile.

## Consequences
**Positive**
- Zero extra realtime authorization to maintain — RLS is the only gate.
- Delete/edit events fan out cleanly with `REPLICA IDENTITY FULL`.

**Negative**
- No typing indicators / presence in v1.
- Slightly heavier DB write path than pure ephemeral broadcast.

**Neutral**
- Requires the client to join the realtime channel before fetching initial messages, to avoid dropped events.

## References
- Memory: `mem://architecture/chat-initialization-logic`, `mem://architecture/chat-deletion-sync`
- Migrations enabling publication for `chat_messages`.