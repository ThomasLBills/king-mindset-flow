import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/forge/atoms";
import { AdminList, type AdminColumn } from "@/components/admin/AdminList";

type Row = {
  user_id: string;
  email: string;
  expires_at: string | null;
  active: boolean;
  daysRemaining: number | null; // null = no expiration (permanent)
  subStatus: "active" | "cancelling" | "cancelled" | "none";
  source: string | null;
};

const PAGE_SIZE = 25;

const SUB_LABELS: Record<Row["subStatus"], string> = {
  active: "Active",
  cancelling: "Cancelling",
  cancelled: "Cancelled",
  none: "None",
};

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "-";

const daysBetween = (iso: string) => {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

const sourceLabel = (source: string | null) => {
  const s = (source || "").toLowerCase();
  if (s === "stripe") return "Stripe";
  if (s) return "Manual"; // zapier_*, admin_grant, admin_extend, etc.
  return "-";
};

const AdminEntitlements = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-entitlements-overview"],
    queryFn: async () => {
      const [profilesRes, rolesRes, entRes, subsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, email"),
        supabase.from("user_roles").select("user_id, role").eq("role", "admin"),
        supabase
          .from("entitlements")
          .select("user_id, expires_at, active, source")
          .eq("entitlement_type", "course_app_access"),
        supabase
          .from("subscriptions")
          .select("user_id, status, updated_at, cancel_at_period_end"),
      ]);

      const adminIds = new Set((rolesRes.data || []).map((r) => r.user_id));
      const entByUser = new Map(
        (entRes.data || []).map((e) => [e.user_id, e])
      );

      // Pick latest subscription per user
      const subByUser = new Map<
        string,
        { status: string; updated_at: string; cancel_at_period_end: boolean }
      >();
      for (const s of subsRes.data || []) {
        const prev = subByUser.get(s.user_id);
        if (!prev || new Date(s.updated_at) > new Date(prev.updated_at)) {
          subByUser.set(s.user_id, {
            status: s.status,
            updated_at: s.updated_at,
            cancel_at_period_end: !!s.cancel_at_period_end,
          });
        }
      }

      const cancelledStatuses = new Set(["canceled", "cancelled", "incomplete_expired"]);
      const activeStatuses = new Set(["active", "trialing", "past_due"]);

      const rows: Row[] = (profilesRes.data || [])
        .filter((p) => !adminIds.has(p.user_id))
        .map((p) => {
          const ent = entByUser.get(p.user_id);
          const sub = subByUser.get(p.user_id);
          let subStatus: Row["subStatus"] = "none";
          if (sub) {
            if (activeStatuses.has(sub.status)) {
              subStatus = sub.cancel_at_period_end ? "cancelling" : "active";
            } else if (cancelledStatuses.has(sub.status)) {
              subStatus = "cancelled";
            } else {
              subStatus = "none";
            }
          }
          return {
            user_id: p.user_id,
            email: p.email,
            expires_at: ent?.expires_at ?? null,
            active: !!ent?.active,
            daysRemaining: ent?.expires_at ? daysBetween(ent.expires_at) : null,
            subStatus,
            source: ent?.source ?? null,
          };
        });

      // Sort: expired first (most negative), then soonest, then permanent (null) last
      rows.sort((a, b) => {
        if (a.expires_at && b.expires_at)
          return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
        if (a.expires_at && !b.expires_at) return -1;
        if (!a.expires_at && b.expires_at) return 1;
        return a.email.localeCompare(b.email);
      });

      return rows;
    },
  });

  const extend = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.functions.invoke("admin-extend-entitlement", {
        body: { userId, days: 30 },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-entitlements-overview"] });
      toast({ title: "Access extended by 30 days" });
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    const matchesStatus = (r: Row) => {
      switch (status) {
        case "active":
          return r.active;
        case "expiring":
          return r.daysRemaining !== null && r.daysRemaining <= 14 && r.daysRemaining > 0;
        case "expired":
          return r.daysRemaining !== null && r.daysRemaining <= 0;
        case "permanent":
          return r.daysRemaining === null;
        default:
          return true;
      }
    };
    return data.filter(
      (r) => (!q || r.email.toLowerCase().includes(q)) && matchesStatus(r)
    );
  }, [data, search, status]);

  // Client-side pagination reset when the visible set changes.
  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const renderDays = (r: Row) => {
    if (r.daysRemaining === null) {
      return <Badge variant="secondary">Permanent</Badge>;
    }
    const d = r.daysRemaining;
    const cls =
      d <= 0
        ? "bg-ember/15 text-ember border-ember/40"
        : d <= 14
        ? "bg-gold/10 text-gold-bright border-gold-deep/50"
        : "bg-forge-2 text-bone-2 border-line-soft";
    const label = d <= 0 ? "Expired" : `${d} day${d === 1 ? "" : "s"}`;
    return (
      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium", cls)}>
        {label}
      </span>
    );
  };

  const renderSub = (r: Row) => {
    const map: Record<Row["subStatus"], { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
      active: { label: "Active", variant: "default" },
      cancelling: { label: "Cancelling", variant: "outline", className: "border-ember/40 text-ember" },
      cancelled: { label: "Cancelled", variant: "outline", className: "border-ember/40 bg-ember/15 text-ember" },
      none: { label: "None", variant: "secondary" },
    };
    const m = map[r.subStatus];
    return <Badge variant={m.variant} className={m.className}>{m.label}</Badge>;
  };

  const renderSource = (r: Row) => {
    const label = sourceLabel(r.source);
    return <Badge variant={label === "Stripe" ? "default" : "secondary"}>{label}</Badge>;
  };

  const columns: AdminColumn<Row>[] = [
    {
      id: "email",
      header: "Email",
      primary: true,
      truncate: true,
      csv: (r) => r.email,
      cell: (r) => <span className="text-sm font-medium text-bone">{r.email}</span>,
    },
    {
      id: "expires",
      header: "Expires",
      csv: (r) => (r.expires_at ? formatDate(r.expires_at) : "-"),
      cell: (r) => <span className="text-sm text-dim">{r.expires_at ? formatDate(r.expires_at) : "-"}</span>,
    },
    {
      id: "days",
      header: "Days remaining",
      csv: (r) =>
        r.daysRemaining === null
          ? "Permanent"
          : r.daysRemaining <= 0
          ? "Expired"
          : `${r.daysRemaining} days`,
      cell: (r) => renderDays(r),
    },
    {
      id: "sub",
      header: "Subscription",
      csv: (r) => SUB_LABELS[r.subStatus],
      cell: (r) => renderSub(r),
    },
    {
      id: "source",
      header: "Source",
      csv: (r) => sourceLabel(r.source),
      cell: (r) => renderSource(r),
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <Eyebrow className="mb-1 block">Access</Eyebrow>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
          Entitlements
        </h1>
        <p className="mt-1 text-sm text-dim">
          Non-admin users sorted by expiration date (most urgent first).
        </p>
      </header>

      <AdminList<Row>
        caption="User entitlements sorted by expiration"
        noun="users"
        columns={columns}
        rows={paged}
        getRowId={(r) => r.user_id}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        search={search}
        onSearchChange={(v) => setSearch(v)}
        searchPlaceholder="Search by email..."
        page={page}
        pageCount={pageCount}
        onPageChange={setPage}
        total={total}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        csvFilename="entitlements"
        emptyTitle="No users"
        emptyHint={
          search.trim()
            ? `No users match "${search.trim()}".`
            : "No non-admin users match these filters."
        }
        filters={
          <div className="w-full sm:w-40">
            <Label htmlFor="ent-status" className="sr-only">Filter by status</Label>
            <Select
              value={status ?? "all"}
              onValueChange={(v) => setStatus(v === "all" ? undefined : v)}
            >
              <SelectTrigger id="ent-status" className="w-full">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expiring">Expiring</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="permanent">Permanent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        rowActions={(r) => (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => extend.mutate(r.user_id)}
            disabled={extend.isPending}
          >
            <CalendarPlus className="w-3.5 h-3.5" aria-hidden="true" />
            +30 days
          </Button>
        )}
      />
    </div>
  );
};

export default AdminEntitlements;
