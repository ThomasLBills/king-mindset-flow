import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/**
 * Returns Monday 00:00 in the user's LOCAL time zone as a UTC ISO string.
 */
export function getLocalWeekStartISO(): string {
  const now = new Date();
  const dow = now.getDay(); // 0=Sun
  const diff = dow === 0 ? 6 : dow - 1; // days since Monday
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff, 0, 0, 0, 0);
  return monday.toISOString();
}

export function useEvidenceCounter() {
  const { user, session, loading } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["evidence-count", user?.id],
    enabled: !loading && !!user && !!session?.access_token,
    queryFn: async () => {
      // Lifetime count
      const { count: lifetimeCount, error: e1 } = await supabase
        .from("evidence_events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);
      if (e1) throw e1;

      // This-week count (Monday 00:00 local time to now)
      const weekStart = getLocalWeekStartISO();
      const { count: weekCount, error: e2 } = await supabase
        .from("evidence_events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .gte("created_at", weekStart);
      if (e2) throw e2;

      return { lifetime: lifetimeCount ?? 0, thisWeek: weekCount ?? 0 };
    },
  });

  const count = data?.lifetime ?? 0;
  const thisWeekCount = data?.thisWeek ?? 0;

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
      qc.invalidateQueries({ queryKey: ["community-armor-stats"] });
    },
  });

  return { count, thisWeekCount, isLoading, addEvidence };
}
