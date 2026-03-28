import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/**
 * Returns Monday 00:00 Central Time as a UTC ISO string for the current week.
 */
function getCentralWeekStartISO(): string {
  const now = new Date();
  // Get current date parts in Central Time
  const ct = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now); // "YYYY-MM-DD"

  const [y, m, d] = ct.split("-").map(Number);
  const ctDate = new Date(Date.UTC(y, m - 1, d));
  const dow = ctDate.getUTCDay(); // 0=Sun
  const diff = dow === 0 ? 6 : dow - 1;
  ctDate.setUTCDate(ctDate.getUTCDate() - diff);

  // Monday in CT — CT is UTC-6 (CST) or UTC-5 (CDT)
  // Use a fixed offset approach: check if CDT is active
  const jan = new Date(y, 0, 1).toLocaleString("en-US", { timeZone: "America/Chicago" });
  const jul = new Date(y, 6, 1).toLocaleString("en-US", { timeZone: "America/Chicago" });
  // Determine current offset
  const nowCTStr = now.toLocaleString("en-US", { timeZone: "America/Chicago" });
  const nowCTDate = new Date(nowCTStr);
  const offsetMs = now.getTime() - nowCTDate.getTime();
  const offsetHours = Math.round(offsetMs / 3600000);

  // Monday 00:00 CT = Monday 05:00 or 06:00 UTC
  const mondayStr = `${ctDate.getUTCFullYear()}-${String(ctDate.getUTCMonth() + 1).padStart(2, "0")}-${String(ctDate.getUTCDate()).padStart(2, "0")}`;
  // offsetHours is positive when CT is behind UTC (5 or 6)
  return new Date(`${mondayStr}T00:00:00-0${offsetHours}:00`).toISOString();
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
      const weekStartCT = getCentralWeekStartISO();
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
