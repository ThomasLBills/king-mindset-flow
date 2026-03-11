import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Brother {
  connectionId: string;
  userId: string;
  displayName: string;
  firstName: string | null;
  avatarUrl: string | null;
  status: string;
  isRequester: boolean;
}

export function useBrothers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: brothers = [], isLoading } = useQuery({
    queryKey: ["brothers", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("brotherhood_connections")
        .select("*")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user!.id},recipient_id.eq.${user!.id}`);
      if (!data?.length) return [];

      const otherIds = data.map(c =>
        c.requester_id === user!.id ? c.recipient_id : c.requester_id
      );
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, first_name, avatar_url")
        .in("user_id", otherIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      return data.map(c => {
        const otherId = c.requester_id === user!.id ? c.recipient_id : c.requester_id;
        const p = profileMap.get(otherId);
        return {
          connectionId: c.id,
          userId: otherId,
          displayName: p?.display_name || p?.first_name || "User",
          firstName: p?.first_name,
          avatarUrl: p?.avatar_url,
          status: c.status,
          isRequester: c.requester_id === user!.id,
        } as Brother;
      });
    },
  });

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ["brotherhood-pending", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("brotherhood_connections")
        .select("*")
        .eq("status", "pending")
        .eq("recipient_id", user!.id);
      if (!data?.length) return [];

      const requesterIds = data.map(c => c.requester_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, first_name, avatar_url")
        .in("user_id", requesterIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      return data.map(c => {
        const p = profileMap.get(c.requester_id);
        return {
          connectionId: c.id,
          userId: c.requester_id,
          displayName: p?.display_name || p?.first_name || "User",
          firstName: p?.first_name,
          avatarUrl: p?.avatar_url,
          status: c.status,
          isRequester: false,
        } as Brother;
      });
    },
  });

  // Track outgoing pending requests to prevent duplicate sends
  const { data: outgoingPendingIds = [] } = useQuery({
    queryKey: ["brotherhood-outgoing", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("brotherhood_connections")
        .select("recipient_id")
        .eq("status", "pending")
        .eq("requester_id", user!.id);
      return data?.map(c => c.recipient_id) ?? [];
    },
  });

  // Track declined connections to prevent re-requesting
  const { data: declinedIds = [] } = useQuery({
    queryKey: ["brotherhood-declined", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("brotherhood_connections")
        .select("requester_id, recipient_id")
        .eq("status", "declined")
        .or(`requester_id.eq.${user!.id},recipient_id.eq.${user!.id}`);
      return data?.map(c => c.requester_id === user!.id ? c.recipient_id : c.requester_id) ?? [];
    },
  });

  const { data: maxBrothers = 5 } = useQuery({
    queryKey: ["max-brothers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "max_brothers")
        .single();
      return typeof data?.value === "number" ? data.value : 5;
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["brothers"] });
    queryClient.invalidateQueries({ queryKey: ["brotherhood-pending"] });
  };

  const sendRequest = useMutation({
    mutationFn: async (recipientId: string) => {
      const { error } = await supabase.from("brotherhood_connections").insert({
        requester_id: user!.id,
        recipient_id: recipientId,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const acceptRequest = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from("brotherhood_connections")
        .update({ status: "accepted" })
        .eq("id", connectionId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const declineRequest = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from("brotherhood_connections")
        .update({ status: "declined" })
        .eq("id", connectionId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const removeBrother = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from("brotherhood_connections")
        .delete()
        .eq("id", connectionId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    brothers,
    pendingRequests,
    maxBrothers,
    isLoading,
    atCapacity: brothers.length >= maxBrothers,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeBrother,
  };
}

export function useSearchUsers(query: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["search-users", query],
    enabled: !!user && query.length >= 2,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, first_name, avatar_url")
        .neq("user_id", user!.id)
        .or(`display_name.ilike.%${query}%,first_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);
      return data ?? [];
    },
  });
}
