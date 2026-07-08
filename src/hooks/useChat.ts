import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

type Channel = Tables<"chat_channels">;
type Message = Tables<"chat_messages">;
type DM = Tables<"chat_dms">;

export interface ChatMessage extends Message {
  profile?: { display_name: string | null; first_name: string | null; avatar_url: string | null };
}

export type ChatTarget =
  | { type: "channel"; id: string; name: string }
  | { type: "dm"; id: string; name: string };

export function useChannels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("chat_channels")
      .select("*")
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        setChannels(data ?? []);
        setLoading(false);
      });
  }, []);

  return { channels, loading };
}

export function useDMs() {
  const { user } = useAuth();
  const [dms, setDMs] = useState<(DM & { otherName: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("chat_dms")
      .select("*")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .then(async ({ data }) => {
        if (!data) { setLoading(false); return; }
        const otherIds = data.map(d => d.user_a === user.id ? d.user_b : d.user_a);
        const { data: profiles } = await supabase
          .rpc("get_profiles_directory", { _user_ids: otherIds });
        const profileMap = new Map(
          (profiles ?? []).map((p: { user_id: string; display_name: string | null; first_name: string | null }) =>
            [p.user_id, p.display_name || p.first_name || "User"] as const
          )
        );
        setDMs(data.map(d => ({
          ...d,
          otherName: profileMap.get(d.user_a === user.id ? d.user_b : d.user_a) || "User",
        })));
        setLoading(false);
      });
  }, [user]);

  return { dms, loading };
}

export function useMessages(target: ChatTarget | null, ready = true) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(!!target);

  const fetchMessages = useCallback(async () => {
    if (!target || !ready) return;
    setLoading(true);

    const baseQuery = supabase
      .from("chat_messages")
      .select("*");

    const scopedQuery = target.type === "channel"
      ? baseQuery.eq("channel_id", target.id)
      : baseQuery.eq("dm_id", target.id);

    const { data } = await scopedQuery
      .order("created_at", { ascending: false })
      .limit(100);

    if (!data) { setLoading(false); return; }

    const orderedMessages = [...data].reverse();
    const userIds = [...new Set(orderedMessages.map(m => m.user_id))];
    const { data: profiles } = await supabase
      .rpc("get_profiles_directory", { _user_ids: userIds });
    const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p] as const));

    setMessages(orderedMessages.map(m => ({
      ...m,
      profile: profileMap.get(m.user_id) ?? undefined,
    })));
    setLoading(false);
  }, [target?.type, target?.id, ready]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!target || !ready) return;
    const channel = supabase
      .channel(`chat-${target.type}-${target.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: target.type === "channel"
          ? `channel_id=eq.${target.id}`
          : `dm_id=eq.${target.id}`,
      }, async (payload) => {
        const msg = payload.new as Message;
        const { data: profiles } = await supabase
          .rpc("get_profiles_directory", { _user_ids: [msg.user_id] });
        const profile = profiles?.[0];
        setMessages(prev => [...prev, { ...msg, profile: profile ?? undefined }]);
      })
      .on("postgres_changes", {
        event: "DELETE",
        schema: "public",
        table: "chat_messages",
        filter: target.type === "channel"
          ? `channel_id=eq.${target.id}`
          : `dm_id=eq.${target.id}`,
      }, (payload) => {
        const deleted = payload.old as { id: string };
        setMessages(prev => prev.filter(m => m.id !== deleted.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [target?.type, target?.id, ready]);

  const sendMessage = useCallback(async (content: string, imageUrl?: string) => {
    if (!target || !user) throw new Error("Not ready to send");
    if (typeof window !== "undefined" && localStorage.getItem("lk_impersonation_meta")) {
      throw new Error("Sending is disabled during impersonation.");
    }
    const { error } = await supabase.from("chat_messages").insert({
      content,
      user_id: user.id,
      image_url: imageUrl || null,
      ...(target.type === "channel" ? { channel_id: target.id } : { dm_id: target.id }),
    });
    if (error) throw error;
  }, [target, user]);

  return { messages, loading, sendMessage, refetch: fetchMessages };
}

export function useJoinChannel() {
  const { user } = useAuth();
  return useCallback(async (channelId: string) => {
    if (!user) return;
    await supabase.from("chat_channel_members").upsert(
      { channel_id: channelId, user_id: user.id },
      { onConflict: "channel_id,user_id", ignoreDuplicates: true }
    );
  }, [user]);
}
