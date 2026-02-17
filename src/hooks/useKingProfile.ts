import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useFreedomStreak } from "./useDailyProgress";
import { usePublishedWeeks, useCurriculumLessonProgress, useAllPublishedCurriculumLessons } from "./useCurriculum";

export function useKingProfile() {
  const { user } = useAuth();
  const { daysFree, hasStreak } = useFreedomStreak();

  // Days Consistent — count of distinct daily_check_ins
  const { data: daysConsistent = 0 } = useQuery({
    queryKey: ["king-profile-days-consistent", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("daily_check_ins")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);
      if (error) throw error;
      return count ?? 0;
    },
  });

  // Pillars Completed — total daily_completions across all categories
  const { data: pillarsCompleted = 0 } = useQuery({
    queryKey: ["king-profile-pillars", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("daily_completions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);
      if (error) throw error;
      return count ?? 0;
    },
  });

  // Support Connections — daily_check_ins where needs_support = true
  const { data: supportConnections = 0 } = useQuery({
    queryKey: ["king-profile-support", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("daily_check_ins")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("needs_support", true);
      if (error) throw error;
      return count ?? 0;
    },
  });

  // Breakthrough Moments — daily_check_ins with non-empty spirit_response
  const { data: spiritBreakthroughs = 0 } = useQuery({
    queryKey: ["king-profile-breakthroughs-spirit", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("daily_check_ins")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .neq("spirit_response", "")
        .not("spirit_response", "is", null);
      if (error) throw error;
      return count ?? 0;
    },
  });

  // Crisis breakthroughs — daily_completions with category "crisis_breakthrough"
  const { data: crisisBreakthroughs = 0 } = useQuery({
    queryKey: ["king-profile-breakthroughs-crisis", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("daily_completions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("category", "crisis_breakthrough");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const breakthroughMoments = spiritBreakthroughs + crisisBreakthroughs;

  // Curriculum Progress
  const { data: weeks = [] } = usePublishedWeeks();
  const { data: progressMap } = useCurriculumLessonProgress();
  const { data: allLessons = [] } = useAllPublishedCurriculumLessons();

  // Calculate which weeks are complete
  const completedWeekNumbers: number[] = [];
  let currentWeekNumber = 1;
  let totalWeeks = weeks.length || 8;

  if (weeks.length > 0 && progressMap && allLessons.length > 0) {
    for (const week of weeks) {
      const weekLessons = allLessons.filter(l => l.week_id === week.id);
      const allComplete = weekLessons.length > 0 && weekLessons.every(l => progressMap.get(l.id)?.status === "completed");
      if (allComplete) {
        completedWeekNumbers.push(week.week_number);
      }
    }

    // Current week = first incomplete week
    const sortedWeeks = [...weeks].sort((a, b) => a.order_index - b.order_index);
    for (const week of sortedWeeks) {
      const weekLessons = allLessons.filter(l => l.week_id === week.id);
      const allComplete = weekLessons.length > 0 && weekLessons.every(l => progressMap.get(l.id)?.status === "completed");
      if (!allComplete) {
        currentWeekNumber = week.week_number;
        break;
      }
      currentWeekNumber = week.week_number;
    }
    totalWeeks = weeks.length;
  }

  // Dynamic headline based on completed weeks
  const getHeadline = (): string => {
    const maxCompleted = completedWeekNumbers.length > 0 ? Math.max(...completedWeekNumbers) : 0;
    if (maxCompleted >= 8) return "You are a King walking in Restored Purpose.";
    if (maxCompleted >= 7) return "You are walking in Brotherhood.";
    if (maxCompleted >= 6) return "You are building daily rhythms of freedom.";
    if (maxCompleted >= 5) return "You are learning to stand against temptation.";
    if (maxCompleted >= 4) return "You are walking in Grace, Identity, Mind Renewal, and the Spirit.";
    if (maxCompleted >= 3) return "You are walking in Grace, Identity, and Mind Renewal.";
    if (maxCompleted >= 2) return "You are walking in Grace and Identity.";
    if (maxCompleted >= 1) return "You are walking in Grace.";
    return "Your journey as a King begins here.";
  };

  return {
    daysConsistent,
    pillarsCompleted,
    supportConnections,
    breakthroughMoments,
    currentWeekNumber,
    totalWeeks,
    completedWeekNumbers,
    headline: getHeadline(),
    daysFree,
    hasStreak,
  };
}
