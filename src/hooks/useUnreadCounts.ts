import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UnreadCounts {
  /** channel_id or dm_id → count */
  byConversation: Record<string, number>;
  /** total unread across all conversations */
  total: number;
}

export function useUnreadCounts() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<UnreadCounts>({ byConversation: {}, total: 0 });

  const fetchCounts = useCallback(async () => {
    if (!user) return;

    // 1. Get user's channel memberships
    const { data: memberships } = await supabase
      .from("chat_channel_members")
      .select("channel_id")
      .eq("user_id", user.id);

    // 2. Get user's DMs
    const { data: dms } = await supabase
      .from("chat_dms")
      .select("id")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

    // 3. Get read cursors
    const { data: cursors } = await supabase
      .from("chat_read_cursors")
      .select("channel_id, dm_id, last_read_at")
      .eq("user_id", user.id);

    const cursorMap = new Map<string, string>();
    cursors?.forEach((c) => {
      const key = c.channel_id || c.dm_id;
      if (key) cursorMap.set(key, c.last_read_at);
    });

    const result: Record<string, number> = {};

    // 4. Count unread channel messages
    const channelIds = memberships?.map((m) => m.channel_id) ?? [];
    for (const chId of channelIds) {
      const lastRead = cursorMap.get(chId);
      let query = supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("channel_id", chId)
        .neq("user_id", user.id);
      if (lastRead) query = query.gt("created_at", lastRead);
      const { count } = await query;
      if (count && count > 0) result[chId] = count;
    }

    // 5. Count unread DM messages
    const dmIds = dms?.map((d) => d.id) ?? [];
    for (const dmId of dmIds) {
      const lastRead = cursorMap.get(dmId);
      let query = supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("dm_id", dmId)
        .neq("user_id", user.id);
      if (lastRead) query = query.gt("created_at", lastRead);
      const { count } = await query;
      if (count && count > 0) result[dmId] = count;
    }

    const total = Object.values(result).reduce((s, n) => s + n, 0);
    setCounts({ byConversation: result, total });
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Realtime: listen for new messages across all channels/DMs
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("unread-badge")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const msg = payload.new as { user_id: string; channel_id: string | null; dm_id: string | null };
          if (msg.user_id === user.id) return; // own messages don't count
          const convId = msg.channel_id || msg.dm_id;
          if (!convId) return;
          setCounts((prev) => {
            const updated = { ...prev.byConversation };
            updated[convId] = (updated[convId] || 0) + 1;
            return {
              byConversation: updated,
              total: Object.values(updated).reduce((s, n) => s + n, 0),
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = useCallback(
    async (conversationId: string, type: "channel" | "dm") => {
      if (!user) return;
      const now = new Date().toISOString();

      // Upsert the cursor
      const payload = {
        user_id: user.id,
        last_read_at: now,
        ...(type === "channel"
          ? { channel_id: conversationId, dm_id: null }
          : { dm_id: conversationId, channel_id: null }),
      };

      // Try update first, then insert
      const colName = type === "channel" ? "channel_id" : "dm_id";
      const { data: existing } = await supabase
        .from("chat_read_cursors")
        .select("id")
        .eq("user_id", user.id)
        .eq(colName, conversationId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("chat_read_cursors")
          .update({ last_read_at: now })
          .eq("id", existing.id);
      } else {
        await supabase.from("chat_read_cursors").insert(payload);
      }

      // Clear local count
      setCounts((prev) => {
        const updated = { ...prev.byConversation };
        delete updated[conversationId];
        return {
          byConversation: updated,
          total: Object.values(updated).reduce((s, n) => s + n, 0),
        };
      });
    },
    [user]
  );

  return { counts, markAsRead, refetch: fetchCounts };
}
