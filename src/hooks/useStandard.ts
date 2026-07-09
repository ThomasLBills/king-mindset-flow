/**
 * "The Standard" - NEW feature from the Forge redesign (features.theStandard).
 * Derived entirely from existing production data, no new tables:
 *   cycle start = user_enrollments.enrolled_at (fallback: profile created_at)
 *   fell days   = relapse_events (the same table the original R.E.T.U.R.N.
 *                 tool logs to), one "fell" per calendar day with an event.
 * Recording a fall goes through useRelapseEventLogger so the event carries
 * the same context (program day, recent emotions) as the original app.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { differenceInCalendarDays, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRelapseEventLogger } from "@/hooks/useTriggerPatterns";

export type DayOutcome = "held" | "fell";

export interface StandardCycle {
  /** Days since the cycle started, 1-based */
  day: number;
  longestRun: number;
  /** Outcome per day in the visible window (last 30 days), oldest first */
  days: DayOutcome[];
}

/** Window shown as tick bars; the full history still feeds longestRun. */
const WINDOW_DAYS = 30;

const localDayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const useStandard = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["forge-standard", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<StandardCycle> => {
      const [{ data: enrollment }, { data: profile }, { data: relapses }] = await Promise.all([
        supabase
          .from("user_enrollments")
          .select("enrolled_at")
          .eq("user_id", user!.id)
          .maybeSingle(),
        supabase.from("profiles").select("created_at").eq("user_id", user!.id).maybeSingle(),
        supabase
          .from("relapse_events")
          .select("relapsed_at")
          .eq("user_id", user!.id)
          .order("relapsed_at", { ascending: true }),
      ]);

      const start = new Date(enrollment?.enrolled_at ?? profile?.created_at ?? Date.now());
      const today = new Date();
      const dayNumber = Math.max(differenceInCalendarDays(today, start), 0) + 1;

      const fellDays = new Set((relapses ?? []).map((r) => localDayKey(new Date(r.relapsed_at))));

      const windowLen = Math.min(dayNumber, WINDOW_DAYS);
      const days: DayOutcome[] = Array.from({ length: windowLen }, (_, i) => {
        const date = subDays(today, windowLen - 1 - i);
        return fellDays.has(localDayKey(date)) ? "fell" : "held";
      });

      // Longest held run across the whole cycle: gaps between fall days.
      const fallOffsets = [...fellDays]
        .map((key) => differenceInCalendarDays(new Date(`${key}T12:00:00`), start))
        .filter((off) => off >= 0 && off < dayNumber)
        .sort((a, b) => a - b);
      let longestRun = 0;
      let prev = -1;
      for (const off of fallOffsets) {
        longestRun = Math.max(longestRun, off - prev - 1);
        prev = off;
      }
      longestRun = Math.max(longestRun, dayNumber - 1 - prev - 1);

      return { day: dayNumber, longestRun: Math.max(longestRun, 0), days };
    },
  });
};

/**
 * The return after a fall: today goes on the record as fell - and stays
 * there. The Standard never resets; grace keeps the whole story.
 */
export const useRecordFall = () => {
  const { logRelapseEvent } = useRelapseEventLogger();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await logRelapseEvent.mutateAsync();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["forge-standard"] }),
  });
};
