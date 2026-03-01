import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const getMonthStart = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01T00:00:00`;
};

export function useEvidenceCounter() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: count = 0, isLoading } = useQuery({
    queryKey: ["evidence-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("evidence_events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const addEvidence = useMutation({
    mutationFn: async (eventType: string) => {
      if (!user) return;
      const { error } = await supabase.from("evidence_events").insert({
        user_id: user.id,
        event_type: eventType,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["evidence-count"] });
    },
  });

  return { count, isLoading, addEvidence };
}
