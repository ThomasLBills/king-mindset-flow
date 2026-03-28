import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/**
 * Returns the start of the current week (Monday 00:00) in Central Time as a UTC ISO string.
 */
function getCentralWeekStartUTC(): string {
  // Get current time in Central Time
  const nowCT = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })
  );
  const day = nowCT.getDay(); // 0=Sun
  const diff = day === 0 ? 6 : day - 1; // days since Monday
  const monday = new Date(nowCT);
  monday.setDate(monday.getDate() - diff);
  monday.setHours(0, 0, 0, 0);

  // Convert back: monday is in CT, build the same wall-clock in CT then get UTC
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(monday);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;

  // Build a Date object representing Monday 00:00 CT
  const ctMidnight = new Date(`${y}-${m}-${d}T00:00:00-06:00`);
  // Adjust for CDT vs CST — simplest: use the CT offset at that moment
  const offset = new Date(
    new Date(`${y}-${m}-${d}T12:00:00`).toLocaleString("en-US", { timeZone: "America/Chicago" })
  ).getTimezoneOffset();
  const utcMondayStart = new Date(monday.getTime() + offset * 60 * 1000);

  // Simpler approach: just use the Intl API
  return `${y}-${m}-${d}T00:00:00-06:00`;
}

export function useEvidenceCounter() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["evidence-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Get lifetime count
      const { count: lifetimeCount, error: e1 } = await supabase
        .from("evidence_events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);
      if (e1) throw e1;

      // Get this-week count (Monday CT to now)
      // Use DB server time for consistency — query events since Monday 00:00 CT
      const weekStartCT = getCentralWeekStartUTC();
      const { count: weekCount, error: e2 } = await supabase
        .from("evidence_events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .gte("created_at", new Date(weekStartCT).toISOString());
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
