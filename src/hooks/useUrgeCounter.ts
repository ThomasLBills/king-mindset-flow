import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const getMonthStart = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01T00:00:00`;
};

const getTodayStart = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  // Build local midnight and convert to ISO with correct offset so Supabase compares in the user's local day
  const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return localMidnight.toISOString();
};

export function useUrgeCounter() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: dailyCount = 0 } = useQuery({
    queryKey: ["urge-count-daily", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("evidence_events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("event_type", "urge_redirected")
        .gte("created_at", getTodayStart());
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: monthlyCount = 0 } = useQuery({
    queryKey: ["urge-count-monthly", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("evidence_events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("event_type", "urge_redirected")
        .gte("created_at", getMonthStart());
      if (error) throw error;
      return count ?? 0;
    },
  });

  const addUrge = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase.from("evidence_events").insert({
        user_id: user.id,
        event_type: "urge_redirected",
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["urge-count-daily"] });
      qc.invalidateQueries({ queryKey: ["urge-count-monthly"] });
      qc.invalidateQueries({ queryKey: ["evidence-count"] });
    },
  });

  return { dailyCount, monthlyCount, addUrge };
}
