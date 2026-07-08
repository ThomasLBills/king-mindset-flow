import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Hash, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SectionCard } from "@/components/forge/atoms";

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
      <SectionCard className="p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Hash className="h-5 w-5 text-gold" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold tracking-tight text-bone">Channels</h2>
          </div>
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
        </div>

        {isLoading ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <ul>
            {channels.map((ch) => (
              <li
                key={ch.id}
                className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line-soft py-3.5 first:border-t-0"
              >
                <span className="flex min-w-0 flex-1 items-center gap-2.5">
                  <Hash className="h-4 w-4 shrink-0 text-dim" aria-hidden="true" />
                  <span className="truncate font-display text-base font-bold tracking-tight text-bone">
                    {ch.name}
                  </span>
                </span>
                <div className="flex items-center gap-5">
                  <span className="flex items-center gap-2 text-xs text-dim">
                    <Switch
                      checked={(ch as any).is_default}
                      onCheckedChange={(v) => toggleField.mutate({ id: ch.id, field: "is_default", value: v })}
                      aria-label={`Default channel: ${ch.name}`}
                    />
                    Default
                  </span>
                  <span className="flex items-center gap-2 text-xs text-dim">
                    <Switch
                      checked={(ch as any).is_pinned}
                      onCheckedChange={(v) => toggleField.mutate({ id: ch.id, field: "is_pinned", value: v })}
                      aria-label={`Pin channel: ${ch.name}`}
                    />
                    Pinned
                  </span>
                  <span className="flex items-center gap-2 text-xs text-dim">
                    <Switch
                      checked={(ch as any).is_locked}
                      onCheckedChange={(v) => toggleField.mutate({ id: ch.id, field: "is_locked", value: v })}
                      aria-label={`Lock channel: ${ch.name}`}
                    />
                    Locked
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteChannel.mutate(ch.id)}
                    aria-label={`Delete channel: ${ch.name}`}
                  >
                    <Trash2 className="h-4 w-4 text-ember" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard className="p-5 sm:p-6">
        <h2 className="mb-4 font-display text-lg font-bold tracking-tight text-bone">Brotherhood settings</h2>
        <div className="flex items-center gap-4">
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
