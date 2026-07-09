import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Shield, ShieldCheck, ShieldOff, UserPlus, Trash2, LogIn, Trophy, Copy, Check, UserRoundCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { Eyebrow } from "@/components/forge/atoms";
import { AdminList, type AdminColumn } from "@/components/admin/AdminList";
import { useAdminCollection } from "@/hooks/useAdminCollection";

const CT_TZ = "America/Chicago";
const formatCT = (iso: string, fmt = "MMM d, yyyy") =>
  format(toZonedTime(new Date(iso), CT_TZ), fmt);

const COLLECTION_KEY = ["admin-users-collection"] as const;

type ProfileRow = {
  user_id: string;
  email: string;
  display_name: string | null;
  name: string | null;
  created_at: string;
  last_seen_at: string | null;
};

type EnrichedUser = ProfileRow & {
  entitlement: { active: boolean; expires_at: string | null; source: string | null } | null;
  subscription: { status: string } | null;
  isAdmin: boolean;
};

const AdminUsers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { startImpersonation } = useImpersonation();
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
  const [impersonateTarget, setImpersonateTarget] = useState<{ id: string; name: string; email: string } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [grantAccess, setGrantAccess] = useState(true);

  const [credentialModal, setCredentialModal] = useState<{ email: string; tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Primary collection: one page of profiles at a time, enriched with that
  // page's entitlements / subscriptions / admin flag (never the whole table).
  const collection = useAdminCollection<ProfileRow, EnrichedUser>({
    key: COLLECTION_KEY,
    table: "profiles",
    select: "user_id, email, display_name, name, created_at, last_seen_at",
    searchColumns: ["email", "display_name", "name"],
    defaultSort: { column: "created_at", dir: "desc" },
    enrich: async (profiles) => {
      const ids = profiles.map((p) => p.user_id);
      if (ids.length === 0) return [];
      const [entRes, subRes, roleRes] = await Promise.all([
        supabase.from("entitlements").select("user_id, active, expires_at, source").eq("entitlement_type", "course_app_access").in("user_id", ids),
        supabase.from("subscriptions").select("user_id, status, updated_at").in("user_id", ids),
        supabase.from("user_roles").select("user_id").eq("role", "admin").in("user_id", ids),
      ]);
      const entBy = new Map((entRes.data ?? []).map((e) => [e.user_id, e]));
      const subBy = new Map<string, { status: string; updated_at: string }>();
      for (const s of subRes.data ?? []) {
        const prev = subBy.get(s.user_id);
        if (!prev || new Date(s.updated_at) > new Date(prev.updated_at)) subBy.set(s.user_id, s);
      }
      const adminSet = new Set((roleRes.data ?? []).map((r) => r.user_id));
      return profiles.map((p) => ({
        ...p,
        entitlement: entBy.get(p.user_id) ?? null,
        subscription: subBy.get(p.user_id) ?? null,
        isAdmin: adminSet.has(p.user_id),
      }));
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: COLLECTION_KEY });

  // Cross-page lookups (small, all-user aggregates) kept as siblings.
  const { data: loginData } = useQuery({
    queryKey: ["admin-user-logins"],
    queryFn: async () => {
      const [edgeRes, profilesRes] = await Promise.all([
        supabase.functions.invoke("admin-user-logins"),
        supabase.from("profiles").select("user_id, last_seen_at"),
      ]);
      const authUsers = (edgeRes.data?.users || []) as Array<{ id: string; last_sign_in_at: string | null }>;
      const profileRows = (profilesRes.data || []) as Array<{ user_id: string; last_seen_at: string | null }>;
      const map = new Map<string, string | null>();
      for (const u of authUsers) map.set(u.id, u.last_sign_in_at);
      for (const p of profileRows) {
        const authDate = map.get(p.user_id);
        if (p.last_seen_at && (!authDate || new Date(p.last_seen_at) > new Date(authDate))) map.set(p.user_id, p.last_seen_at);
      }
      return map;
    },
  });

  const { data: evidenceCounts } = useQuery({
    queryKey: ["admin-evidence-counts"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_evidence_counts_by_user");
      const map = new Map<string, number>();
      for (const e of (data || []) as Array<{ user_id: string; evidence_count: number }>) map.set(e.user_id, e.evidence_count);
      return map;
    },
  });

  const toggleEntitlement = useMutation({
    mutationFn: async ({ userId, active }: { userId: string; active: boolean }) => {
      const { error } = await supabase.functions.invoke("admin-toggle-entitlement", { body: { userId, active } });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Entitlement updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const toggleRole = useMutation({
    mutationFn: async ({ userId, makeAdmin }: { userId: string; makeAdmin: boolean }) => {
      const { data, error } = await supabase.functions.invoke("admin-toggle-role", { body: { userId, makeAdmin } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Role updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const createUser = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: { email: newEmail, name: newName, grantAccess },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { tempPassword: string; email: string };
    },
    onSuccess: (data) => {
      invalidate();
      setAddOpen(false);
      setNewEmail("");
      setNewName("");
      setCredentialModal({ email: data.email, tempPassword: data.tempPassword });
      setCopied(false);
    },
    onError: (err: any) => toast({ title: "Error creating user", description: err.message, variant: "destructive" }),
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("admin-delete-user", { body: { userId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "User deleted" });
    },
    onError: (err: any) => toast({ title: "Error deleting user", description: err.message, variant: "destructive" }),
  });

  // Bulk grant/revoke over the selected page rows (selection is page-scoped, so
  // this is bounded to one page of users).
  const bulkSetAccess = async (ids: string[], active: boolean, clear: () => void) => {
    try {
      await Promise.all(ids.map((userId) => supabase.functions.invoke("admin-toggle-entitlement", { body: { userId, active } })));
      invalidate();
      toast({ title: active ? `Granted access to ${ids.length}` : `Revoked access from ${ids.length}` });
      clear();
    } catch (err: any) {
      toast({ title: "Bulk update failed", description: err?.message, variant: "destructive" });
    }
  };

  const formatEntitlementSource = (source?: string | null) => {
    const s = (source || "").toLowerCase();
    if (s === "stripe") return "Stripe";
    if (s === "zapier_eight-week-course" || s === "admin_grant" || s === "admin_extend") return "Manual";
    return source ? source.replace("zapier_", "").replace(/_/g, " ") : "-";
  };

  const formatDaysRemaining = (expiresAt?: string | null) => {
    if (!expiresAt) return "Permanent";
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return "Expired";
    return `${days} day${days === 1 ? "" : "s"}`;
  };

  const columns: AdminColumn<EnrichedUser>[] = [
    {
      id: "email",
      header: "Email",
      sortKey: "email",
      truncate: true,
      csv: (u) => u.email,
      cell: (u) => <span className="text-sm text-bone">{u.email}</span>,
    },
    {
      id: "name",
      header: "Name",
      truncate: true,
      csv: (u) => u.display_name || u.name || "",
      cell: (u) => <span className="text-sm text-bone-2">{u.display_name || u.name || "-"}</span>,
    },
    {
      id: "created_at",
      header: "Joined",
      sortKey: "created_at",
      csv: (u) => formatCT(u.created_at),
      cell: (u) => <span className="text-sm text-dim">{formatCT(u.created_at)}</span>,
    },
    {
      id: "last_login",
      header: "Last login",
      csv: (u) => {
        const t = loginData?.get(u.user_id);
        return t ? formatCT(t) : "Never";
      },
      cell: (u) => {
        const t = loginData?.get(u.user_id);
        return t ? (
          <span className="flex items-center gap-1 text-sm text-dim">
            <LogIn className="h-3.5 w-3.5 text-success" aria-hidden="true" /> {formatCT(t)}
          </span>
        ) : (
          <span className="text-sm text-dim/60">Never</span>
        );
      },
    },
    {
      id: "liberations",
      header: "Liberations",
      csv: (u) => evidenceCounts?.get(u.user_id) ?? 0,
      cell: (u) => (
        <span className="flex items-center gap-1 text-sm font-medium text-bone tabular-nums">
          <Trophy className="h-3.5 w-3.5 text-gold" aria-hidden="true" /> {evidenceCounts?.get(u.user_id) ?? 0}
        </span>
      ),
    },
    {
      id: "role",
      header: "Role",
      csv: (u) => (u.isAdmin ? "Admin" : "User"),
      cell: (u) => <Badge variant={u.isAdmin ? "default" : "secondary"}>{u.isAdmin ? "Admin" : "User"}</Badge>,
    },
    {
      id: "access",
      header: "Access",
      csv: (u) => (u.entitlement?.active ? formatDaysRemaining(u.entitlement.expires_at) : "No access"),
      cell: (u) => (
        <div className="min-w-32 space-y-1.5">
          <Badge variant={u.entitlement?.active ? "default" : "secondary"}>{u.entitlement?.active ? "Active" : "Inactive"}</Badge>
          <div className="text-sm font-medium text-bone-2">{u.entitlement ? formatDaysRemaining(u.entitlement.expires_at) : "No access"}</div>
          <div className="text-xs capitalize text-dim">{formatEntitlementSource(u.entitlement?.source)}</div>
        </div>
      ),
    },
    {
      id: "subscription",
      header: "Subscription",
      csv: (u) => u.subscription?.status || "",
      cell: (u) => <span className="text-sm capitalize text-bone-2">{u.subscription?.status || "-"}</span>,
    },
  ];

  const handleCopyPassword = async () => {
    if (!credentialModal) return;
    await navigator.clipboard.writeText(credentialModal.tempPassword);
    setCopied(true);
    toast({ title: "Password copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Eyebrow className="mb-1 block">Users</Eyebrow>
            <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">People in the fight</h1>
            <p className="mt-1 text-sm text-dim">Manage user access, subscriptions, and roles.</p>
          </div>
        </header>

        <AdminList<EnrichedUser>
          caption="Users with access, role, and subscription status"
          noun="users"
          columns={columns}
          rows={collection.rows}
          getRowId={(u) => u.user_id}
          isLoading={collection.isLoading}
          isFetching={collection.isFetching}
          isError={collection.isError}
          onRetry={collection.refetch}
          search={collection.search}
          onSearchChange={collection.setSearch}
          searchPlaceholder="Search by email or name..."
          sort={collection.sort}
          onToggleSort={collection.toggleSort}
          page={collection.page}
          pageCount={collection.pageCount}
          onPageChange={collection.setPage}
          total={collection.total}
          rangeStart={collection.rangeStart}
          rangeEnd={collection.rangeEnd}
          csvFilename="users"
          emptyTitle="No users"
          emptyHint="No one matches the current search."
          selectable
          bulkActions={(ids, clear) => (
            <>
              <Button size="sm" onClick={() => bulkSetAccess(ids, true, clear)}>Grant access</Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive">Revoke access</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-display text-lg font-bold uppercase tracking-wide text-bone">Revoke access from {ids.length}?</AlertDialogTitle>
                    <AlertDialogDescription>These users will immediately lose course access. You can re-grant it at any time.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => bulkSetAccess(ids, false, clear)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Revoke</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          toolbarActions={
            <>
              <Button variant="outline" asChild className="gap-1.5">
                <Link to="/admin/entitlements">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Entitlements
                </Link>
              </Button>
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-1.5"><UserPlus className="h-4 w-4" aria-hidden="true" /> Add user</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-display text-lg font-bold uppercase tracking-wide text-bone">Create a user</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div>
                      <Label htmlFor="new-email">Email</Label>
                      <Input id="new-email" type="email" placeholder="user@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="new-name">Name (optional)</Label>
                      <Input id="new-name" placeholder="Display name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="grant-access" checked={grantAccess} onCheckedChange={(v) => setGrantAccess(!!v)} />
                      <Label htmlFor="grant-access">Grant course access immediately</Label>
                    </div>
                    <p className="text-xs text-dim">A temporary password will be generated. No email will be sent - you'll share the credentials manually.</p>
                    <Button className="w-full" onClick={() => createUser.mutate()} disabled={createUser.isPending || !newEmail}>
                      {createUser.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Create user"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          }
          rowActions={(u) => (
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                size="sm"
                variant={u.entitlement?.active ? "destructive" : "default"}
                onClick={() => toggleEntitlement.mutate({ userId: u.user_id, active: !u.entitlement?.active })}
                disabled={toggleEntitlement.isPending}
              >
                {u.entitlement?.active ? "Revoke" : "Grant"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleRole.mutate({ userId: u.user_id, makeAdmin: !u.isAdmin })}
                disabled={toggleRole.isPending}
                className="gap-1"
              >
                {u.isAdmin ? <><ShieldOff className="h-3.5 w-3.5" aria-hidden="true" /> Remove admin</> : <><Shield className="h-3.5 w-3.5" aria-hidden="true" /> Make admin</>}
              </Button>
              {!u.isAdmin && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1"
                  onClick={() => setImpersonateTarget({ id: u.user_id, name: u.display_name || u.name || u.email, email: u.email })}
                  disabled={impersonatingId === u.user_id}
                >
                  {impersonatingId === u.user_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <UserRoundCog className="h-3.5 w-3.5" aria-hidden="true" />}
                  Impersonate
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive" className="gap-1">
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-display text-lg font-bold uppercase tracking-wide text-bone">Delete user</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete <strong>{u.email}</strong> and all their data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteUser.mutate(u.user_id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {deleteUser.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Delete permanently"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        />
      </div>

      {/* Credential Modal */}
      <Dialog open={!!credentialModal} onOpenChange={(open) => { if (!open) setCredentialModal(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold uppercase tracking-wide text-bone">User created</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-dim">Email</Label>
              <p className="text-sm font-medium text-bone">{credentialModal?.email}</p>
            </div>
            <div>
              <Label className="text-xs text-dim">Temporary password</Label>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 select-all rounded-md border border-line bg-forge-2 px-4 py-3 text-center font-mono text-xl font-bold tracking-widest text-bone">
                  {credentialModal?.tempPassword}
                </code>
                <Button variant="outline" size="icon" onClick={handleCopyPassword} className="shrink-0" aria-label="Copy temporary password">
                  {copied ? <Check className="h-4 w-4 text-success" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                </Button>
              </div>
            </div>
            <p className="text-sm text-dim">Share this password with the user. They will be asked to set their own password when they sign in.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setCredentialModal(null)} className="w-full">Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!impersonateTarget} onOpenChange={(open) => { if (!open) setImpersonateTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-lg font-bold uppercase tracking-wide text-bone">Impersonate {impersonateTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              You will see the app exactly as <strong>{impersonateTarget?.email}</strong> sees it. Row-level security is enforced against their account. You can browse and view everything, but billing, chat, declarations, and account deletion are disabled. This session is fully audited.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!impersonateTarget) return;
                const target = impersonateTarget;
                setImpersonatingId(target.id);
                setImpersonateTarget(null);
                try {
                  await startImpersonation(target.id);
                  toast({ title: `Viewing as ${target.name}` });
                  navigate("/app");
                } catch (err: any) {
                  toast({ title: "Impersonation failed", description: err?.message ?? "Unknown error", variant: "destructive" });
                } finally {
                  setImpersonatingId(null);
                }
              }}
            >
              Start session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminUsers;
