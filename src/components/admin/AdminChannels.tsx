import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Hash, Plus, Trash2 } from "lucide-react";
import { notify } from "@/lib/notify";
import { useConfirm } from "@/components/feedback";
import { SectionCard } from "@/components/forge/atoms";
import { AdminList, type AdminColumn } from "@/components/admin/AdminList";
import { logAdminAudit } from "@/lib/adminAudit";

const AdminChannels = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: channels = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-channels"],
    queryFn: async () => {
      const { data, error } = await supabase.from("chat_channels").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  type Channel = (typeof channels)[number];

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
      const name = newName.trim().toLowerCase().replace(/\s+/g, "-");
      const { data: ch, error } = await supabase.from("chat_channels").insert({
        name,
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
        await logAdminAudit({ action: "create", entityType: "chat_channel", entityId: ch.id, after: { name } });
      }
    },
    onSuccess: () => {
      invalidate();
      setNewName("");
      setNewDesc("");
      setDialogOpen(false);
      notify.success("Channel created");
    },
    // Failure surfaces via the global mutation-error net (mapSupabaseError toast).
  });

  const toggleField = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: boolean }) => {
      const { error } = await supabase.from("chat_channels").update({ [field]: value }).eq("id", id);
      if (error) throw error;
      await logAdminAudit({ action: "update", entityType: "chat_channel", entityId: id, after: { [field]: value } });
    },
    // Optimistic: flip the switch immediately, roll back if the write fails.
    onMutate: async ({ id, field, value }) => {
      await queryClient.cancelQueries({ queryKey: ["admin-channels"] });
      const prev = queryClient.getQueryData<Channel[]>(["admin-channels"]);
      queryClient.setQueryData<Channel[]>(["admin-channels"], (old) =>
        (old ?? []).map((c) => (c.id === id ? { ...c, [field]: value } : c))
      );
      return { prev };
    },
    // Roll back the optimistic switch; the failure toast comes from the global net.
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["admin-channels"], ctx.prev);
    },
    onSettled: invalidate,
  });

  const deleteChannel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chat_channels").delete().eq("id", id);
      if (error) throw error;
      await logAdminAudit({ action: "delete", entityType: "chat_channel", entityId: id });
    },
    onSuccess: () => { invalidate(); notify.success("Channel deleted"); },
  });

  const handleDeleteChannel = async (ch: Channel) => {
    const ok = await confirm({
      title: `Delete #${ch.name}?`,
      consequence: "This permanently removes the channel and its messages, and cannot be undone.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    deleteChannel.mutate(ch.id);
  };

  const updateMaxBrothers = useMutation({
    mutationFn: async (value: number) => {
      const { error } = await supabase.from("app_settings").update({ value: value as any }).eq("key", "max_brothers");
      if (error) throw error;
      await logAdminAudit({ action: "update", entityType: "app_settings", entityId: "max_brothers", after: { value } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      notify.success("Max brothers updated");
    },
  });

  const columns: AdminColumn<Channel>[] = [
    {
      id: "name",
      header: "Channel",
      primary: true,
      truncate: true,
      csv: (ch) => ch.name,
      cell: (ch) => (
        <span className="flex items-center gap-2.5">
          <Hash className="h-4 w-4 shrink-0 text-dim" aria-hidden="true" />
          <span className="font-display text-base font-bold tracking-tight text-bone">{ch.name}</span>
        </span>
      ),
    },
    {
      id: "default",
      header: "Default",
      cell: (ch) => (
        <Switch
          checked={(ch as any).is_default}
          onCheckedChange={(v) => toggleField.mutate({ id: ch.id, field: "is_default", value: v })}
          aria-label={`Default channel: ${ch.name}`}
        />
      ),
    },
    {
      id: "pinned",
      header: "Pinned",
      cell: (ch) => (
        <Switch
          checked={(ch as any).is_pinned}
          onCheckedChange={(v) => toggleField.mutate({ id: ch.id, field: "is_pinned", value: v })}
          aria-label={`Pin channel: ${ch.name}`}
        />
      ),
    },
    {
      id: "locked",
      header: "Locked",
      cell: (ch) => (
        <Switch
          checked={(ch as any).is_locked}
          onCheckedChange={(v) => toggleField.mutate({ id: ch.id, field: "is_locked", value: v })}
          aria-label={`Lock channel: ${ch.name}`}
        />
      ),
    },
  ];

  const newChannelDialog = (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4" aria-hidden="true" /> New channel</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display">Create channel</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="channel-name">Name</Label>
            <Input id="channel-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="channel-name" />
          </div>
          <div>
            <Label htmlFor="channel-desc">Description (optional)</Label>
            <Input id="channel-desc" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What's this channel for?" />
          </div>
          <Button onClick={() => createChannel.mutate()} disabled={!newName.trim() || createChannel.isPending} className="w-full">
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <AdminList<Channel>
        caption="Community channels"
        noun="channels"
        columns={columns}
        rows={channels}
        getRowId={(ch) => ch.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyTitle="No channels yet"
        toolbarActions={newChannelDialog}
        rowActions={(ch) => (
          <Button
            size="icon"
            variant="ghost"
            aria-label={`Delete channel: ${ch.name}`}
            onClick={() => handleDeleteChannel(ch)}
            disabled={deleteChannel.isPending}
          >
            <Trash2 className="h-4 w-4 text-ember" aria-hidden="true" />
          </Button>
        )}
      />

      <SectionCard className="p-5 sm:p-6">
        <h2 className="mb-4 font-display text-lg font-bold tracking-tight text-bone">Brotherhood settings</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Label htmlFor="max-brothers">Max brothers per user</Label>
          <Input
            id="max-brothers"
            type="number"
            min={1}
            max={20}
            value={maxBrothers as number}
            onChange={(e) => updateMaxBrothers.mutate(Number(e.target.value))}
            className="w-20"
          />
        </div>
      </SectionCard>
    </div>
  );
};

export default AdminChannels;
