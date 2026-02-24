import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Search, Shield, ShieldOff, UserPlus, Mail, Trash2, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const AdminUsers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [grantAccess, setGrantAccess] = useState(true);
  const [sendInvite, setSendInvite] = useState(true);

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
        body: { email: newEmail, password: sendInvite ? undefined : newPassword, name: newName, grantAccess, sendInvite },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-entitlements"] });
      toast({ title: sendInvite ? "Invite sent successfully" : "User created successfully" });
      setAddOpen(false);
      setNewEmail("");
      setNewPassword("");
      setNewName("");
    },
    onError: (err: any) => toast({ title: "Error creating user", description: err.message, variant: "destructive" }),
  });

  const resendInvite = useMutation({
    mutationFn: async (email: string) => {
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: { email, action: "resend_invite" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      toast({ title: "Invite email sent" });
    },
    onError: (err: any) => toast({ title: "Error sending invite", description: err.message, variant: "destructive" }),
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("admin-delete-user", {
        body: { userId },
      });
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

  const filtered = (profiles || []).filter((p) =>
    !search || p.email.toLowerCase().includes(search.toLowerCase()) || (p.display_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const canCreate = newEmail && (sendInvite || newPassword);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">Manage user access, subscriptions, and roles</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5"><UserPlus className="w-4 h-4" /> Add User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
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
                <Checkbox id="send-invite" checked={sendInvite} onCheckedChange={(v) => setSendInvite(!!v)} />
                <Label htmlFor="send-invite">Send invite email (user sets their own password)</Label>
              </div>
              {!sendInvite && (
                <div>
                  <Label>Temporary Password</Label>
                  <Input type="text" placeholder="Set a password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Checkbox id="grant-access" checked={grantAccess} onCheckedChange={(v) => setGrantAccess(!!v)} />
                <Label htmlFor="grant-access">Grant course access immediately</Label>
              </div>
              <Button className="w-full" onClick={() => createUser.mutate()} disabled={createUser.isPending || !canCreate}>
                {createUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : sendInvite ? "Send Invite" : "Create User"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by email or name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card className="card-elevated">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                 <TableRow>
                   <TableHead>Email</TableHead>
                   <TableHead>Name</TableHead>
                   <TableHead>Joined</TableHead>
                   <TableHead>Role</TableHead>
                   <TableHead>Entitlement</TableHead>
                   <TableHead>Source</TableHead>
                   <TableHead>Subscription</TableHead>
                   <TableHead>Actions</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const ent = getEntitlement(p.user_id);
                  const sub = getSubscription(p.user_id);
                  const admin = isAdmin(p.user_id);
                  return (
                    <TableRow key={p.user_id}>
                       <TableCell className="text-sm">{p.email}</TableCell>
                       <TableCell className="text-sm">{p.display_name || p.name || "—"}</TableCell>
                       <TableCell className="text-sm text-muted-foreground">
                         {format(new Date(p.created_at), "MMM d, yyyy")}
                       </TableCell>
                       <TableCell>
                         <Badge variant={admin ? "default" : "secondary"}>{admin ? "Admin" : "User"}</Badge>
                       </TableCell>
                       <TableCell>
                         <Badge variant={ent?.active ? "default" : "secondary"}>{ent?.active ? "Active" : "Inactive"}</Badge>
                       </TableCell>
                       <TableCell className="text-sm capitalize">{ent?.source?.replace("zapier_", "").replace("_", " ") || "—"}</TableCell>
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
                            {admin ? <><ShieldOff className="w-3.5 h-3.5" /> Remove Admin</> : <><Shield className="w-3.5 h-3.5" /> Make Admin</>}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resendInvite.mutate(p.email)}
                            disabled={resendInvite.isPending}
                            className="gap-1"
                          >
                            <Mail className="w-3.5 h-3.5" /> Send Invite
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" className="gap-1">
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
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
                                  {deleteUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete permanently"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminUsers;
