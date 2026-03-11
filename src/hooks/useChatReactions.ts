import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Reaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

export type ReactionMap = Record<string, Reaction[]>;

export function useChatReactions(messageIds: string[]) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<ReactionMap>({});

  const fetchReactions = useCallback(async () => {
    if (!messageIds.length) return;
    const { data } = await supabase
      .from("chat_reactions")
      .select("*")
      .in("message_id", messageIds);
    if (!data) return;

    const map: ReactionMap = {};
    for (const r of data) {
      if (!map[r.message_id]) map[r.message_id] = [];
      const existing = map[r.message_id].find(e => e.emoji === r.emoji);
      if (existing) {
        existing.count++;
        if (r.user_id === user?.id) existing.reacted = true;
      } else {
        map[r.message_id].push({ emoji: r.emoji, count: 1, reacted: r.user_id === user?.id });
      }
    }
    setReactions(map);
  }, [messageIds.join(","), user?.id]);

  useEffect(() => { fetchReactions(); }, [fetchReactions]);

  // Realtime
  useEffect(() => {
    if (!messageIds.length) return;
    const channel = supabase
      .channel("chat-reactions")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_reactions" }, () => {
        fetchReactions();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [messageIds.join(","), fetchReactions]);

  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return;
    // Check directly from DB to avoid stale closure
    const { data: existing } = await supabase
      .from("chat_reactions")
      .select("id")
      .match({ message_id: messageId, user_id: user.id, emoji })
      .maybeSingle();
    if (existing) {
      await supabase.from("chat_reactions").delete().eq("id", existing.id);
    } else {
      await supabase.from("chat_reactions").insert({ message_id: messageId, user_id: user.id, emoji });
    }
  }, [user]);

  return { reactions, toggleReaction };
}
