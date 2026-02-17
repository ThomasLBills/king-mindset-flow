import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const getLocalDate = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

// ========== DAILY CHECK-IN ==========
export function useDailyCheckIn() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const today = getLocalDate();

  const { data: todayCheckIn, isLoading } = useQuery({
    queryKey: ["daily-check-in", user?.id, today],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("daily_check_ins")
        .select("*")
        .eq("user_id", user!.id)
        .eq("check_in_date", today)
        .maybeSingle();
      return data;
    },
  });

  const submitCheckIn = useMutation({
    mutationFn: async (params: { feelings: string[]; needsSupport: boolean; spiritResponse?: string }) => {
      const { error } = await supabase.from("daily_check_ins").upsert({
        user_id: user!.id,
        check_in_date: today,
        feelings: params.feelings,
        needs_support: params.needsSupport,
        spirit_response: params.spiritResponse ?? null,
      } as any, { onConflict: "user_id,check_in_date" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily-check-in"] });
      qc.invalidateQueries({ queryKey: ["king-profile-breakthroughs"] });
    },
  });

  return {
    isCheckedIn: !!todayCheckIn,
    todayCheckIn,
    isLoading,
    submitCheckIn,
  };
}

// ========== DAILY COMPLETIONS ==========
export function useDailyCompletions(category: string, itemIds: string[]) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const today = getLocalDate();

  const { data: completions = [], isLoading } = useQuery({
    queryKey: ["daily-completions", user?.id, today, category],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("daily_completions")
        .select("item_id")
        .eq("user_id", user!.id)
        .eq("completion_date", today)
        .eq("category", category);
      return data?.map(d => d.item_id) ?? [];
    },
  });

  const toggleCompletion = useMutation({
    mutationFn: async (itemId: string) => {
      if (completions.includes(itemId)) {
        // Remove completion
        await supabase
          .from("daily_completions")
          .delete()
          .eq("user_id", user!.id)
          .eq("completion_date", today)
          .eq("category", category)
          .eq("item_id", itemId);
      } else {
        // Add completion
        const { error } = await supabase.from("daily_completions").upsert({
          user_id: user!.id,
          completion_date: today,
          category,
          item_id: itemId,
        }, { onConflict: "user_id,completion_date,category,item_id" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily-completions", user?.id, today, category] });
    },
  });

  const markCompleted = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("daily_completions").upsert({
        user_id: user!.id,
        completion_date: today,
        category,
        item_id: itemId,
      }, { onConflict: "user_id,completion_date,category,item_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily-completions", user?.id, today, category] });
    },
  });

  const isCompleted = (itemId: string) => completions.includes(itemId);
  const completedCount = itemIds.filter(id => completions.includes(id)).length;

  return {
    completions,
    isCompleted,
    completedCount,
    totalItems: itemIds.length,
    toggleCompletion,
    markCompleted,
    isLoading,
  };
}

// ========== FREEDOM STREAK ==========
export function useFreedomStreak() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: streak, isLoading } = useQuery({
    queryKey: ["freedom-streak", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("freedom_streaks")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const resetStreak = useMutation({
    mutationFn: async () => {
      const today = getLocalDate();
      const { error } = await supabase.from("freedom_streaks").upsert({
        user_id: user!.id,
        start_date: today,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["freedom-streak"] });
    },
  });

  const startDate = streak?.start_date ? new Date(streak.start_date + "T00:00:00") : new Date();
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - startDate.getTime());
  const daysFree = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return {
    startDate,
    daysFree,
    isLoading,
    resetStreak,
    hasStreak: !!streak,
  };
}

// ========== ALL COMPLETIONS FOR TODAY (cross-category) ==========
export function useTodayAllCompletions() {
  const { user } = useAuth();
  const today = getLocalDate();

  return useQuery({
    queryKey: ["daily-completions-all", user?.id, today],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("daily_completions")
        .select("category, item_id")
        .eq("user_id", user!.id)
        .eq("completion_date", today);
      return data ?? [];
    },
  });
}
