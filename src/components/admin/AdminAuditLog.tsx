import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuditLog } from "@/hooks/useAdminCurriculum";
import { Eyebrow, SectionCard } from "@/components/forge/atoms";
import { LkMonogram } from "@/components/forge/brand";

const actionColors: Record<string, string> = {
  create: "default",
  update: "secondary",
  delete: "destructive",
  publish: "default",
  unpublish: "outline",
  reorder: "secondary",
  duplicate: "outline",
};

const AdminAuditLog = () => {
  const { data: logs, isLoading } = useAuditLog(100);

  return (
    <div className="space-y-6">
      <header>
        <Eyebrow className="mb-1 block">Admin</Eyebrow>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
          Audit log
        </h1>
        <p className="mt-1 text-sm text-dim">A record of every admin action.</p>
      </header>

      <SectionCard className="p-5">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : !logs?.length ? (
          <div className="py-12 text-center">
            <LkMonogram className="mx-auto mb-3 h-10 w-14 opacity-70" />
            <p className="text-dim">No admin actions on record yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 rounded-lg border border-line p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={actionColors[log.action] as any} className="capitalize">{log.action}</Badge>
                    <span className="text-sm font-medium capitalize text-bone">{log.entity_type}</span>
                    {log.entity_id && <span className="font-mono text-xs text-dim">{log.entity_id.slice(0, 8)}</span>}
                  </div>
                  <p className="mt-1 text-xs text-dim">
                    {new Date(log.created_at).toLocaleString()} · Admin: {log.admin_user_id.slice(0, 8)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
};

export default AdminAuditLog;
