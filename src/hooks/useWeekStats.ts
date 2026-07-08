/**
 * "This week" stats card on Today. Urges come from the same evidence_events
 * stream the original urge counter uses; the two extra rows are NEW
 * (features.extraStats) and derive from existing tables.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getLocalWeekStartISO } from "@/hooks/useEvidenceCounter";

export interface WeekStats {
  urgesRedirected: number;
  readingsFinished: number;
  brothersReached: number;
}

export const useWeekStats = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["forge-week-stats", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<WeekStats> => {
      // Same local-Monday window the urge/evidence counters use, so the
      // Today card agrees with those numbers on adjacent screens.
      const since = getLocalWeekStartISO();

      // count/head for the two numeric stats; distinct dm_ids need the rows
      // but only the dm_id column, capped so a chatty week can't ship 1000s.
      const [{ count: urges }, { count: readings }, { data: dmMessages }] = await Promise.all([
        supabase
          .from("evidence_events")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user!.id)
          .eq("event_type", "urge_redirected")
          .gte("created_at", since),
        supabase
          .from("curriculum_lesson_progress")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user!.id)
          .eq("status", "completed")
          .gte("completed_at", since),
        supabase
          .from("chat_messages")
          .select("dm_id")
          .eq("user_id", user!.id)
          .not("dm_id", "is", null)
          .gte("created_at", since)
          .limit(1000),
      ]);

      return {
        urgesRedirected: urges ?? 0,
        readingsFinished: readings ?? 0,
        brothersReached: new Set((dmMessages ?? []).map((m) => m.dm_id)).size,
      };
    },
  });
};
