import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Hash, Plus, Trash2, Pin, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

const AdminChannels = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: channels = [], isLoading } = useQuery({
    queryKey: ["admin-channels"],
    queryFn: async () => {
      const { data } = await supabase.from("chat_channels").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("*");
      return data ?? [];
    },
  });

  const maxBrothers = settings?.find(s => s.key === "max_brothers")?.value ?? 5;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-channels"] });

  const createChannel = useMutation({
    mutationFn: async () => {
      if (!newName.trim() || !user) return;
      const { data: ch, error } = await supabase.from("chat_channels").insert({
        name: newName.trim().toLowerCase().replace(/\s+/g, "-"),
        description: newDesc || null,
        created_by: user.id,
        sort_order: channels.length + 1,
      }).select("id").single();
      if (error) throw error;
      // Auto-add creator as member
      if (ch) {
        await supabase.from("chat_channel_members").upsert(
          { channel_id: ch.id, user_id: user.id },
          { onConflict: "channel_id,user_id", ignoreDuplicates: true }
        );
      }
    },
    onSuccess: () => {
      invalidate();
      setNewName("");
      setNewDesc("");
      setDialogOpen(false);
      toast.success("Channel created");
    },
    onError: () => toast.error("Failed to create channel"),
  });

  const toggleField = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: boolean }) => {
      const { error } = await supabase.from("chat_channels").update({ [field]: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteChannel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chat_channels").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Channel deleted"); },
  });

  const updateMaxBrothers = useMutation({
    mutationFn: async (value: number) => {
      const { error } = await supabase.from("app_settings").update({ value: value as any }).eq("key", "max_brothers");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success("Max brothers updated");
    },
  });

  return (
    <div className="space-y-6">
      <Card className="card-elevated">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Channels
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4" /> New Channel</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Channel</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="channel-name" />
                </div>
                <div>
                  <Label>Description (optional)</Label>
                  <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What's this channel for?" />
                </div>
                <Button onClick={() => createChannel.mutate()} disabled={!newName.trim() || createChannel.isPending} className="w-full">
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel</TableHead>
                  <TableHead className="text-center">Default</TableHead>
                  <TableHead className="text-center">Pinned</TableHead>
                  <TableHead className="text-center">Locked</TableHead>
                  <TableHead className="text-center">Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channels.map((ch) => (
                  <TableRow key={ch.id}>
                    <TableCell className="font-medium">#{ch.name}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={(ch as any).is_default}
                        onCheckedChange={(v) => toggleField.mutate({ id: ch.id, field: "is_default", value: v })}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={(ch as any).is_pinned}
                        onCheckedChange={(v) => toggleField.mutate({ id: ch.id, field: "is_pinned", value: v })}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={(ch as any).is_locked}
                        onCheckedChange={(v) => toggleField.mutate({ id: ch.id, field: "is_locked", value: v })}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteChannel.mutate(ch.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Brotherhood Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label>Max Brothers per User</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={maxBrothers as number}
              onChange={(e) => updateMaxBrothers.mutate(Number(e.target.value))}
              className="w-20"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminChannels;
