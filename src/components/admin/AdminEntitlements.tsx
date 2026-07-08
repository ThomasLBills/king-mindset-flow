import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, CalendarPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Eyebrow, SectionCard } from "@/components/forge/atoms";
import { LkMonogram } from "@/components/forge/brand";

type Row = {
  user_id: string;
  email: string;
  expires_at: string | null;
  active: boolean;
  daysRemaining: number | null; // null = no expiration (permanent)
  subStatus: "active" | "cancelling" | "cancelled" | "none";
  source: string | null;
};

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";

const daysBetween = (iso: string) => {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

const AdminEntitlements = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
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
    if (!q) return data;
    return data.filter((r) => r.email.toLowerCase().includes(q));
  }, [data, search]);

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
    const s = (r.source || "").toLowerCase();
    let label = "—";
    if (s === "stripe") label = "Stripe";
    else if (s) label = "Manual"; // zapier_*, admin_grant, admin_extend, etc.
    return <Badge variant={label === "Stripe" ? "default" : "secondary"}>{label}</Badge>;
  };

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

      <SectionCard className="p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-lg font-bold tracking-tight text-bone">
            All users <span className="text-dim">({filtered.length})</span>
          </h2>
          <div className="relative w-full sm:max-w-xs">
            <Label htmlFor="ent-search" className="sr-only">Search by email</Label>
            <Input
              id="ent-search"
              placeholder="Search by email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-dim" aria-hidden="true" />
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Days remaining</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.user_id}>
                    <TableCell className="text-sm font-medium text-bone">{r.email}</TableCell>
                    <TableCell className="text-sm text-dim">
                      {r.expires_at ? formatDate(r.expires_at) : "—"}
                    </TableCell>
                    <TableCell>{renderDays(r)}</TableCell>
                    <TableCell>{renderSub(r)}</TableCell>
                    <TableCell>{renderSource(r)}</TableCell>
                    <TableCell className="text-right">
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
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center">
                      <LkMonogram className="mx-auto mb-3 h-8 w-11 opacity-70" />
                      <p className="text-sm text-dim">
                        {search ? "No one matches that search." : "No users found."}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </div>
  );
};

export default AdminEntitlements;