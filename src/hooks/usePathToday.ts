/**
 * "Your path today" on the Today screen: check-in → reading → reflection.
 * Check-in state comes from daily_check_ins (useDailyCheckIn), the reading
 * step from real curriculum progress, and the evening reflection is tracked
 * as a daily_completions row (category "reflection"), the same table the
 * original app tracks daily rhythms in.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDailyCheckIn, useDailyCompletions } from "@/hooks/useDailyProgress";
import { useNextLesson } from "@/hooks/useForgeCurriculum";

export type PathStepKind = "checkin" | "reading" | "reflection";
export type PathStepStatus = "done" | "now" | "locked";

export interface PathStep {
  id: string;
  kind: PathStepKind;
  title: string;
  sub: string;
  status: PathStepStatus;
  to?: string;
}

const REFLECTION_ITEM = "evening";

export const usePathToday = () => {
  const { isCheckedIn, todayCheckIn, isLoading: checkInLoading } = useDailyCheckIn();
  const { data: nextLesson, isLoading: lessonLoading } = useNextLesson();
  const reflection = useDailyCompletions("reflection", [REFLECTION_ITEM]);

  const { user } = useAuth();
  const { data: completedToday } = useQuery({
    queryKey: ["forge-reading-today", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const { count } = await supabase
        .from("curriculum_lesson_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .gte("completed_at", midnight);
      return (count ?? 0) > 0;
    },
  });

  const isLoading = checkInLoading || lessonLoading || reflection.isLoading;

  const checkinDone = isCheckedIn;
  // Done for the day once a lesson was finished today, or nothing is left.
  const readingDone = !!completedToday || nextLesson === null;
  const reflectionDone = reflection.isCompleted(REFLECTION_ITEM);
  const reflectionOpen = new Date().getHours() >= 19;

  const feelings = (todayCheckIn?.feelings ?? []) as string[];

  const steps: PathStep[] = [
    {
      id: "checkin",
      kind: "checkin",
      title: "Morning check-in",
      sub: checkinDone
        ? `Logged: ${feelings.join(", ") || "checked in"}`
        : "Thirty honest seconds",
      status: checkinDone ? "done" : "now",
    },
    {
      id: "reading",
      kind: "reading",
      title: "Today's reading",
      sub: readingDone
        ? "All caught up"
        : nextLesson
          ? `${nextLesson.title} · ${nextLesson.minutes} min`
          : "",
      status: readingDone ? "done" : checkinDone ? "now" : "locked",
      to: nextLesson ? `/app/grow/lesson/${nextLesson.id}` : undefined,
    },
    {
      id: "reflection",
      kind: "reflection",
      title: "Evening reflection",
      sub: reflectionDone ? "Reflection kept" : "Opens tonight",
      status: reflectionDone ? "done" : checkinDone && reflectionOpen ? "now" : "locked",
    },
  ];

  return { data: isLoading ? undefined : steps, isLoading };
};

/** Marks tonight's reflection kept (the text itself stays private/ephemeral). */
export const useCompleteReflection = () => {
  const reflection = useDailyCompletions("reflection", [REFLECTION_ITEM]);
  return {
    mutate: (
      _: undefined,
      opts?: { onSuccess?: () => void }
    ) => reflection.markCompleted.mutate(REFLECTION_ITEM, opts),
    isPending: reflection.markCompleted.isPending,
  };
};
