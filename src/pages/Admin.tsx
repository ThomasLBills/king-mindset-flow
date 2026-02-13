import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Users, CheckCircle, XCircle, Loader2, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminChannels from "@/components/admin/AdminChannels";

const Admin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const toggleEntitlement = useMutation({
    mutationFn: async ({ userId, active }: { userId: string; active: boolean }) => {
      const { error } = await supabase.functions.invoke("admin-toggle-entitlement", {
        body: { userId, active },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-entitlements"] });
      toast({ title: "Entitlement updated" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const getEntitlement = (userId: string) =>
    entitlements?.find((e) => e.user_id === userId && e.entitlement_type === "course_app_access");

  const getSubscription = (userId: string) =>
    subscriptions?.find((s) => s.user_id === userId);

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="font-serif text-3xl font-bold">Admin Dashboard</h1>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{profiles?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Users</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle className="w-6 h-6 mx-auto mb-2 text-success" />
                <p className="text-2xl font-bold">{entitlements?.filter((e) => e.active).length || 0}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <XCircle className="w-6 h-6 mx-auto mb-2 text-destructive" />
                <p className="text-2xl font-bold">{(profiles?.length || 0) - (entitlements?.filter((e) => e.active).length || 0)}</p>
                <p className="text-sm text-muted-foreground">Inactive</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="users">
            <TabsList className="mb-4">
              <TabsTrigger value="users" className="gap-1.5"><Users className="w-4 h-4" /> Users</TabsTrigger>
              <TabsTrigger value="channels" className="gap-1.5"><Hash className="w-4 h-4" /> Community</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle>Users</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Entitlement</TableHead>
                          <TableHead>Subscription</TableHead>
                          <TableHead>Renewal</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profiles?.map((p) => {
                          const ent = getEntitlement(p.user_id);
                          const sub = getSubscription(p.user_id);
                          return (
                            <TableRow key={p.user_id}>
                              <TableCell className="text-sm">{p.email}</TableCell>
                              <TableCell>
                                <Badge variant={ent?.active ? "default" : "secondary"}>
                                  {ent?.active ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm capitalize">{sub?.status || "—"}</TableCell>
                              <TableCell className="text-sm">
                                {sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : "—"}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant={ent?.active ? "destructive" : "default"}
                                  onClick={() => toggleEntitlement.mutate({ userId: p.user_id, active: !ent?.active })}
                                  disabled={toggleEntitlement.isPending}
                                >
                                  {ent?.active ? "Revoke" : "Grant"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="channels">
              <AdminChannels />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default Admin;
