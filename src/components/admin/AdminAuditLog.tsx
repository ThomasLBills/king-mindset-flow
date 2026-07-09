import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Eyebrow } from "@/components/forge/atoms";
import { AdminList, type AdminColumn } from "@/components/admin/AdminList";
import { useAdminCollection } from "@/hooks/useAdminCollection";

const CT_TZ = "America/Chicago";
const formatCT = (iso: string) => format(toZonedTime(new Date(iso), CT_TZ), "MMM d, yyyy h:mm a");

const ACTION_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  create: "default",
  update: "secondary",
  delete: "destructive",
  publish: "default",
  unpublish: "outline",
  reorder: "secondary",
  duplicate: "outline",
  impersonation_start: "outline",
  impersonation_stop: "outline",
};

// Common actions for the filter; free-text actions still match via search.
const ACTIONS = ["create", "update", "delete", "publish", "unpublish", "reorder", "duplicate", "impersonation_start", "impersonation_stop"];

type AuditRow = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  admin_user_id: string;
  created_at: string;
};
type EnrichedAudit = AuditRow & { actorEmail: string | null };

const AdminAuditLog = () => {
  const collection = useAdminCollection<AuditRow, EnrichedAudit>({
    key: ["admin-audit-log"],
    table: "admin_audit_log",
    select: "id, action, entity_type, entity_id, admin_user_id, created_at",
    searchColumns: ["action", "entity_type", "entity_id", "admin_user_id"],
    defaultSort: { column: "created_at", dir: "desc" },
    applyFilters: (q, f) => {
      if (f.action) q = q.eq("action", f.action);
      if (f.from) q = q.gte("created_at", `${f.from}T00:00:00`);
      if (f.to) q = q.lte("created_at", `${f.to}T23:59:59`);
      return q;
    },
    enrich: async (rows) => {
      const ids = Array.from(new Set(rows.map((r) => r.admin_user_id)));
      if (ids.length === 0) return rows.map((r) => ({ ...r, actorEmail: null }));
      const { data } = await supabase.from("profiles").select("user_id, email").in("user_id", ids);
      const emailBy = new Map((data ?? []).map((p) => [p.user_id, p.email]));
      return rows.map((r) => ({ ...r, actorEmail: emailBy.get(r.admin_user_id) ?? null }));
    },
  });

  const columns: AdminColumn<EnrichedAudit>[] = [
    {
      id: "created_at",
      header: "When",
      sortKey: "created_at",
      csv: (r) => formatCT(r.created_at),
      cell: (r) => <span className="whitespace-nowrap text-sm text-dim tabular-nums">{formatCT(r.created_at)}</span>,
    },
    {
      id: "action",
      header: "Action",
      csv: (r) => r.action,
      cell: (r) => <Badge variant={ACTION_VARIANT[r.action] ?? "secondary"} className="capitalize">{r.action.replace(/_/g, " ")}</Badge>,
    },
    {
      id: "entity",
      header: "Entity",
      primary: true,
      truncate: true,
      csv: (r) => `${r.entity_type}${r.entity_id ? ` ${r.entity_id}` : ""}`,
      cell: (r) => (
        <span className="text-sm">
          <span className="capitalize text-bone">{r.entity_type}</span>
          {r.entity_id && <span className="ml-2 font-mono text-xs text-dim">{r.entity_id.slice(0, 8)}</span>}
        </span>
      ),
    },
    {
      id: "actor",
      header: "Actor",
      truncate: true,
      csv: (r) => r.actorEmail ?? r.admin_user_id,
      cell: (r) => <span className="text-sm text-bone-2">{r.actorEmail ?? <span className="font-mono text-xs text-dim">{r.admin_user_id.slice(0, 8)}</span>}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <Eyebrow className="mb-1 block">Admin</Eyebrow>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">Audit log</h1>
        <p className="mt-1 text-sm text-dim">A record of every admin action.</p>
      </header>

      <AdminList<EnrichedAudit>
        caption="Chronological record of admin actions"
        noun="entries"
        columns={columns}
        rows={collection.rows}
        getRowId={(r) => r.id}
        isLoading={collection.isLoading}
        isFetching={collection.isFetching}
        isError={collection.isError}
        onRetry={collection.refetch}
        search={collection.search}
        onSearchChange={collection.setSearch}
        searchPlaceholder="Search action, entity, or actor..."
        sort={collection.sort}
        onToggleSort={collection.toggleSort}
        page={collection.page}
        pageCount={collection.pageCount}
        onPageChange={collection.setPage}
        total={collection.total}
        rangeStart={collection.rangeStart}
        rangeEnd={collection.rangeEnd}
        csvFilename="audit-log"
        emptyTitle="No admin actions on record"
        emptyHint="Actions like create, update, and delete will appear here as they happen."
        filters={
          <>
            <div className="w-full sm:w-40">
              <Label htmlFor="audit-action" className="sr-only">Filter by action</Label>
              <Select value={collection.filters.action ?? "all"} onValueChange={(v) => collection.setFilter("action", v === "all" ? undefined : v)}>
                <SelectTrigger id="audit-action" className="w-full">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  {ACTIONS.map((a) => (
                    <SelectItem key={a} value={a} className="capitalize">{a.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="audit-from" className="w-8 shrink-0 text-xs text-dim sm:w-auto">From</Label>
                <Input id="audit-from" type="date" value={collection.filters.from ?? ""} onChange={(e) => collection.setFilter("from", e.target.value || undefined)} className="flex-1 sm:w-[9.5rem] sm:flex-none" />
              </div>
              <div className="flex items-center gap-1.5">
                <Label htmlFor="audit-to" className="w-8 shrink-0 text-xs text-dim sm:w-auto">To</Label>
                <Input id="audit-to" type="date" value={collection.filters.to ?? ""} onChange={(e) => collection.setFilter("to", e.target.value || undefined)} className="flex-1 sm:w-[9.5rem] sm:flex-none" />
              </div>
            </div>
          </>
        }
      />
    </div>
  );
};

export default AdminAuditLog;
