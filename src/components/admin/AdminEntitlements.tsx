import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck, CalendarPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Row = {
  user_id: string;
  email: string;
  expires_at: string | null;
  active: boolean;
  daysRemaining: number | null; // null = no expiration (permanent)
  subStatus: "active" | "cancelled" | "none";
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
          .select("user_id, expires_at, active")
          .eq("entitlement_type", "course_app_access"),
        supabase.from("subscriptions").select("user_id, status, updated_at"),
      ]);

      const adminIds = new Set((rolesRes.data || []).map((r) => r.user_id));
      const entByUser = new Map(
        (entRes.data || []).map((e) => [e.user_id, e])
      );

      // Pick latest subscription per user
      const subByUser = new Map<string, { status: string; updated_at: string }>();
      for (const s of subsRes.data || []) {
        const prev = subByUser.get(s.user_id);
        if (!prev || new Date(s.updated_at) > new Date(prev.updated_at)) {
          subByUser.set(s.user_id, s);
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
            if (activeStatuses.has(sub.status)) subStatus = "active";
            else if (cancelledStatuses.has(sub.status)) subStatus = "cancelled";
            else subStatus = "none";
          }
          return {
            user_id: p.user_id,
            email: p.email,
            expires_at: ent?.expires_at ?? null,
            active: !!ent?.active,
            daysRemaining: ent?.expires_at ? daysBetween(ent.expires_at) : null,
            subStatus,
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
      d < 0
        ? "bg-destructive/15 text-destructive border-destructive/30"
        : d <= 14
        ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30"
        : "bg-success/15 text-success border-success/30";
    const label = d < 0 ? `Expired ${Math.abs(d)}d ago` : `${d} day${d === 1 ? "" : "s"}`;
    return (
      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium", cls)}>
        {label}
      </span>
    );
  };

  const renderSub = (r: Row) => {
    const map: Record<Row["subStatus"], { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      active: { label: "Active", variant: "default" },
      cancelled: { label: "Cancelled", variant: "destructive" },
      none: { label: "None", variant: "outline" },
    };
    const m = map[r.subStatus];
    return <Badge variant={m.variant}>{m.label}</Badge>;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-primary" />
        <div>
          <h1 className="font-serif text-3xl font-bold">Entitlements</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Non-admin users sorted by expiration date (most urgent first).
          </p>
        </div>
      </div>

      <Card className="card-elevated">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">All Users ({filtered.length})</CardTitle>
          <Input
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Days Remaining</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.user_id}>
                      <TableCell className="text-sm font-medium">{r.email}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.expires_at ? formatDate(r.expires_at) : "—"}
                      </TableCell>
                      <TableCell>{renderDays(r)}</TableCell>
                      <TableCell>{renderSub(r)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => extend.mutate(r.user_id)}
                          disabled={extend.isPending}
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                          +30 days
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8 text-sm">
                        No users found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminEntitlements;