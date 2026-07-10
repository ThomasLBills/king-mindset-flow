import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminEngagementStats() {
  return useQuery({
    queryKey: ["admin-engagement-stats"],
    queryFn: async () => {
      const [enrollments, completedProgress, publishedLessons, activeLearnersRes] = await Promise.all([
        supabase.from("user_enrollments").select("*", { count: "exact", head: true }),
        supabase.from("curriculum_lesson_progress").select("*", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("curriculum_lessons").select("*", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("curriculum_lesson_progress").select("user_id").eq("status", "completed"),
      ]);

      const completed = completedProgress.count ?? 0;
      const publishedCount = publishedLessons.count ?? 0;
      
      // ⚠️ IMPORTANT: Completion Rate is scoped to ACTIVE LEARNERS ONLY.
      // "Active learner" = a user with at least 1 completed lesson.
      // Enrolled users with zero completions are excluded from BOTH numerator and denominator.
      // DO NOT change this to use totalEnrollments - that dilutes the metric.
      const activeUserIds = new Set((activeLearnersRes.data ?? []).map(r => r.user_id));
      const activeLearners = activeUserIds.size;
      const totalPossible = activeLearners * publishedCount;
      const completionRate = totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0;

      return {
        totalEnrollments: enrollments.count ?? 0,
        lessonsCompleted: completed,
        completionRate,
        activeLearners,
      };
    },
  });
}
