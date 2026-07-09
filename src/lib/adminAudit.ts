import { supabase } from "@/integrations/supabase/client";

/**
 * Write an admin_audit_log row for a client-side admin mutation.
 *
 * This is ADVISORY only: a forged client could skip it, so it is not a
 * security control. Privileged actions (user/role/billing) must be audited
 * inside their edge function instead; direct client table writes
 * (app_settings, chat_channels) use this for a consistent trail, and should
 * additionally be backed by a DB trigger for an unskippable record (see
 * ADMIN_RUNBOOK.md section 4). RLS ("Admins insert audit log") already gates
 * who may insert.
 */
export async function logAdminAudit(entry: {
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
}): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("admin_audit_log").insert({
    admin_user_id: user.id,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
    before_json: (entry.before ?? null) as never,
    after_json: (entry.after ?? null) as never,
  });
}
