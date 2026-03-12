import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const getLocalDate = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

// ========== CRISIS BUTTON LOGGING ==========
export function useCrisisEventLogger() {
  const { user } = useAuth();

  const logCrisisEvent = useMutation({
    mutationFn: async (selectedFeeling?: string) => {
      if (!user) return;
      await supabase.from("crisis_button_events").insert({
        user_id: user.id,
        triggered_at: new Date().toISOString(),
        selected_feeling: selectedFeeling ?? null,
      });
    },
  });

  return { logCrisisEvent };
}

// ========== RELAPSE EVENT LOGGING ==========
export function useRelapseEventLogger() {
  const { user } = useAuth();

  const logRelapseEvent = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const now = new Date();
      
      // Fetch recent emotions from last 48 hours of check-ins
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString().split("T")[0];
      const { data: recentCheckIns } = await supabase
        .from("daily_check_ins")
        .select("feelings")
        .eq("user_id", user.id)
        .gte("check_in_date", twoDaysAgo);

      const recentEmotions = recentCheckIns?.flatMap(c => c.feelings) ?? [];

      // Get enrollment date to calculate program day
      const { data: enrollment } = await supabase
        .from("user_enrollments")
        .select("enrolled_at")
        .eq("user_id", user.id)
        .maybeSingle();

      let programDay: number | null = null;
      if (enrollment?.enrolled_at) {
        const enrollDate = new Date(enrollment.enrolled_at);
        programDay = Math.floor((now.getTime() - enrollDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      await supabase.from("relapse_events").insert({
        user_id: user.id,
        relapsed_at: now.toISOString(),
        day_of_week: now.getDay(),
        program_day: programDay,
        recent_emotions: recentEmotions,
      });
    },
  });

  return { logRelapseEvent };
}

