import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Search, Shield, ShieldCheck, ShieldOff, UserPlus, Trash2, LogIn, Trophy, Copy, Check, UserRoundCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { Eyebrow, SectionCard } from "@/components/forge/atoms";
import { LkMonogram } from "@/components/forge/brand";

const CT_TZ = "America/Chicago";
const formatCT = (iso: string, fmt = "MMM d, yyyy") =>
  format(toZonedTime(new Date(iso), CT_TZ), fmt);
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";

const PAGE_SIZE = 25;

const AdminUsers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { startImpersonation } = useImpersonation();
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
  const [impersonateTarget, setImpersonateTarget] = useState<{ id: string; name: string; email: string } | null>(null);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [grantAccess, setGrantAccess] = useState(true);

  // Credential modal state
  const [credentialModal, setCredentialModal] = useState<{ email: string; tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: entitlements } = useQuery({
    queryKey: ["admin-entitlements"],
    queryFn: async () => {
      const { data } = await supabase.from("entitlements").select("*");
      return data || [];
    },
  });

  const { data: subscriptions } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data } = await supabase.from("subscriptions").select("*");
      return data || [];
    },
  });

  const { data: roles } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("*");
      return data || [];
    },
  });

  const { data: loginData } = useQuery({
    queryKey: ["admin-user-logins"],
    queryFn: async () => {
      // Fetch both auth last_sign_in_at and our own last_seen_at from profiles
      const [edgeRes, profilesRes] = await Promise.all([
        supabase.functions.invoke("admin-user-logins"),
        supabase.from("profiles").select("user_id, last_seen_at"),
      ]);
      const authUsers = (edgeRes.data?.users || []) as Array<{ id: string; last_sign_in_at: string | null }>;
      const profileRows = (profilesRes.data || []) as Array<{ user_id: string; last_seen_at: string | null }>;
      
      // Build a map using the most recent of auth.last_sign_in_at vs profiles.last_seen_at
      const map = new Map<string, string | null>();
      for (const u of authUsers) {
        map.set(u.id, u.last_sign_in_at);
      }
      for (const p of profileRows) {
        const authDate = map.get(p.user_id);
        const seenDate = p.last_seen_at;
        if (seenDate && (!authDate || new Date(seenDate) > new Date(authDate))) {
          map.set(p.user_id, seenDate);
        }
      }
      return Array.from(map.entries()).map(([id, ts]) => ({ id, last_sign_in_at: ts }));
    },
  });

  const { data: evidenceCounts } = useQuery({
    queryKey: ["admin-evidence-counts"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_evidence_counts_by_user");
      return (data || []) as Array<{ user_id: string; evidence_count: number }>;
    },
  });

  const toggleEntitlement = useMutation({
    mutationFn: async ({ userId, active }: { userId: string; active: boolean }) => {
      const { error } = await supabase.functions.invoke("admin-toggle-entitlement", { body: { userId, active } });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-entitlements"] });
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
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
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
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-entitlements"] });
      setAddOpen(false);
      setNewEmail("");
      setNewName("");
      // Show credential modal
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
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-entitlements"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      toast({ title: "User deleted" });
    },
    onError: (err: any) => toast({ title: "Error deleting user", description: err.message, variant: "destructive" }),
  });

  const getEntitlement = (userId: string) => entitlements?.find((e) => e.user_id === userId && e.entitlement_type === "course_app_access");
  const getSubscription = (userId: string) => subscriptions?.find((s) => s.user_id === userId);
  const isAdmin = (userId: string) => roles?.some((r) => r.user_id === userId && r.role === "admin");
  const getLastLogin = (userId: string) => loginData?.find((u) => u.id === userId)?.last_sign_in_at;
  const getLiberationCount = (userId: string) => evidenceCounts?.find((e) => e.user_id === userId)?.evidence_count || 0;

  const formatEntitlementSource = (source?: string | null) => {
    const s = (source || "").toLowerCase();
    if (s === "stripe") return "Stripe";
    if (s === "zapier_eight-week-course" || s === "admin_grant" || s === "admin_extend") return "Manual";
    return source ? source.replace("zapier_", "").replace(/_/g, " ") : "—";
  };

  const formatDaysRemaining = (expiresAt?: string | null) => {
    if (!expiresAt) return "Permanent";
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return "Expired";
    return `${days} day${days === 1 ? "" : "s"}`;
  };

  const renderAccessSummary = (ent?: { active?: boolean | null; expires_at?: string | null; source?: string | null } | null) => (
    <div className="min-w-36 space-y-1.5">
      <Badge variant={ent?.active ? "default" : "secondary"}>{ent?.active ? "Active" : "Inactive"}</Badge>
      <div className="text-sm font-medium text-bone-2">{ent ? formatDaysRemaining(ent.expires_at) : "No access"}</div>
      <div className="text-xs capitalize text-dim">{formatEntitlementSource(ent?.source)}</div>
    </div>
  );

  const [page, setPage] = useState(1);

  const filtered = useMemo(() => (profiles || []).filter((p) =>
    !search || p.email.toLowerCase().includes(search.toLowerCase()) || (p.display_name || "").toLowerCase().includes(search.toLowerCase())
  ), [profiles, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

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
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
            People in the fight
          </h1>
          <p className="mt-1 text-sm text-dim">Manage user access, subscriptions, and roles.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild className="gap-1.5">
            <Link to="/admin/entitlements">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" /> Entitlements
            </Link>
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5"><UserPlus className="w-4 h-4" aria-hidden="true" /> Add user</Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display text-lg font-bold uppercase tracking-wide text-bone">Create a user</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Email</Label>
                <Input type="email" placeholder="user@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              </div>
              <div>
                <Label>Name (optional)</Label>
                <Input placeholder="Display name" value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="grant-access" checked={grantAccess} onCheckedChange={(v) => setGrantAccess(!!v)} />
                <Label htmlFor="grant-access">Grant course access immediately</Label>
              </div>
              <p className="text-xs text-dim">
                A temporary password will be generated. No email will be sent — you'll share the credentials manually.
              </p>
              <Button className="w-full" onClick={() => createUser.mutate()} disabled={createUser.isPending || !newEmail}>
                {createUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : "Create user"}
              </Button>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </header>

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
                <code className="flex-1 rounded-md border border-line bg-forge-2 px-4 py-3 text-xl font-mono font-bold tracking-widest text-center text-bone select-all">
                  {credentialModal?.tempPassword}
                </code>
                <Button variant="outline" size="icon" onClick={handleCopyPassword} className="shrink-0" aria-label="Copy temporary password">
                  {copied ? <Check className="w-4 h-4 text-success" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                </Button>
              </div>
            </div>
            <p className="text-sm text-dim">
              Share this password with the user. They will be asked to set their own password when they sign in.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setCredentialModal(null)} className="w-full">Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="relative max-w-sm">
        <Label htmlFor="user-search" className="sr-only">Search by email or name</Label>
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dim" aria-hidden="true" />
        <Input id="user-search" placeholder="Search by email or name..." value={search} onChange={(e) => handleSearch(e.target.value)} className="pl-9" />
      </div>

      <SectionCard className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-dim" aria-hidden="true" /></div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
            <Table>
              <TableHeader>
                 <TableRow>
                   <TableHead>Email</TableHead>
                   <TableHead>Name</TableHead>
                   <TableHead>Joined</TableHead>
                   <TableHead>Last Login</TableHead>
                   <TableHead>Liberations</TableHead>
                   <TableHead>Role</TableHead>
                   <TableHead>Access</TableHead>
                   <TableHead>Subscription</TableHead>
                   <TableHead>Actions</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((p) => {
                  const ent = getEntitlement(p.user_id);
                  const sub = getSubscription(p.user_id);
                  const admin = isAdmin(p.user_id);
                  const lastLogin = getLastLogin(p.user_id);
                  const liberations = getLiberationCount(p.user_id);
                  return (
                    <TableRow key={p.user_id}>
                       <TableCell className="text-sm text-bone">{p.email}</TableCell>
                       <TableCell className="text-sm text-bone-2">{p.display_name || p.name || "—"}</TableCell>
                       <TableCell className="text-sm text-dim">
                         {formatCT(p.created_at)}
                       </TableCell>
                       <TableCell className="text-sm text-dim">
                         {lastLogin ? (
                           <span className="flex items-center gap-1">
                             <LogIn className="w-3.5 h-3.5 text-success" aria-hidden="true" />
                             {formatCT(lastLogin)}
                           </span>
                         ) : (
                           <span className="text-dim/60">Never</span>
                         )}
                       </TableCell>
                       <TableCell>
                         <span className="flex items-center gap-1 text-sm font-medium text-bone">
                           <Trophy className="w-3.5 h-3.5 text-gold" aria-hidden="true" />
                           {liberations}
                         </span>
                       </TableCell>
                       <TableCell>
                         <Badge variant={admin ? "default" : "secondary"}>{admin ? "Admin" : "User"}</Badge>
                       </TableCell>
                       <TableCell>{renderAccessSummary(ent)}</TableCell>
                       <TableCell className="text-sm capitalize">{sub?.status || "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant={ent?.active ? "destructive" : "default"}
                            onClick={() => toggleEntitlement.mutate({ userId: p.user_id, active: !ent?.active })}
                            disabled={toggleEntitlement.isPending}
                          >
                            {ent?.active ? "Revoke" : "Grant"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleRole.mutate({ userId: p.user_id, makeAdmin: !admin })}
                            disabled={toggleRole.isPending}
                            className="gap-1"
                          >
                            {admin ? <><ShieldOff className="w-3.5 h-3.5" aria-hidden="true" /> Remove admin</> : <><Shield className="w-3.5 h-3.5" aria-hidden="true" /> Make admin</>}
                          </Button>
                          {!admin && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="gap-1"
                              onClick={() =>
                                setImpersonateTarget({
                                  id: p.user_id,
                                  name: p.display_name || p.name || p.email,
                                  email: p.email,
                                })
                              }
                              disabled={impersonatingId === p.user_id}
                            >
                              {impersonatingId === p.user_id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                              ) : (
                                <UserRoundCog className="w-3.5 h-3.5" aria-hidden="true" />
                              )}
                              Impersonate
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" className="gap-1">
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-display text-lg font-bold uppercase tracking-wide text-bone">Delete user</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete <strong>{p.email}</strong> and all their data. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteUser.mutate(p.user_id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {deleteUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : "Delete permanently"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {paged.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center">
                      <LkMonogram className="mx-auto mb-3 h-8 w-11 opacity-70" />
                      <p className="text-sm text-dim">
                        {search ? "No one matches that search." : "No users yet."}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          )}
      </SectionCard>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-dim">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} users
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1]) > 1) acc.push("ellipsis");
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "ellipsis" ? (
                    <PaginationItem key={`e-${idx}`}><PaginationEllipsis /></PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink
                        isActive={item === page}
                        onClick={() => setPage(item)}
                        className="cursor-pointer"
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>

      <AlertDialog
        open={!!impersonateTarget}
        onOpenChange={(open) => {
          if (!open) setImpersonateTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-lg font-bold uppercase tracking-wide text-bone">Impersonate {impersonateTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              You will see the app exactly as <strong>{impersonateTarget?.email}</strong> sees
              it. Row-level security is enforced against their account. You can browse and
              view everything, but billing, chat, declarations, and account deletion are
              disabled. This session is fully audited.
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
                  toast({
                    title: "Impersonation failed",
                    description: err?.message ?? "Unknown error",
                    variant: "destructive",
                  });
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
