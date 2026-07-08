# ADR 0006 — Private `chat-files` bucket with user-scoped upload paths and membership-gated reads

- **Status:** Accepted
- **Date:** 2026-04-02, revised 2026-07-08

## Context
Chat supports image attachments. The initial implementation used a public `chat-files` bucket, later privatized. Even after privatization the storage policies allowed any authenticated user to read every file and upload into any path. This meant a user could:

- Read private DM images they had no message-level access to.
- Write objects into another user's folder or spoof paths.

RLS on `chat_messages` correctly hides the message row, but the object URL is discoverable if a client has ever seen it, and signed URLs don't help if the underlying policy is permissive.

## Decision
Enforce ownership at two layers:

1. **Upload path convention.** Client uploads to `chat-files/${auth.uid()}/${timestamp}-${uuid}.${ext}`. The storage INSERT policy checks `(storage.foldername(name))[1] = auth.uid()::text`.
2. **Read gate via message join.** The SELECT policy allows read when the requester is the uploader (path prefix matches), an admin, or there exists a `chat_messages` row whose `image_url` ends in the object name AND the requester is a member of that channel or a party to that DM.

Reads are served through short-lived signed URLs generated client-side after the policy check passes.

## Alternatives considered
- **Move files into per-channel folders.** Rejected: the client uploads before it knows which channel/DM the message will land in for the composer's optimistic flow.
- **Public bucket with obfuscated names.** Rejected: security-through-obscurity; URLs leak.
- **Server-side upload proxy edge function.** Rejected for v1: adds latency and cost; not required now that RLS is tight.

## Consequences
**Positive**
- No cross-user file reads possible; DM attachments are truly private.
- Uploads land only in the user's own folder.
- Admins retain moderation access.

**Negative**
- The SELECT policy runs a join per file access; measurable but acceptable.
- Migrating old objects would require rewriting paths — v1 baseline is small, so left as-is.

**Neutral**
- Client must be authenticated at upload time to compute the path prefix.

## References
- `src/components/chat/MessageComposer.tsx`
- Migrations replacing chat-files storage policies (2026-07-08).
- Memory: `mem://architecture/chat-data-model-and-security`