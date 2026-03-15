import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminEngagementStats() {
  return useQuery({
    queryKey: ["admin-engagement-stats"],
    queryFn: async () => {
      const [enrollments, completedProgress, publishedLessons] = await Promise.all([
        supabase.from("user_enrollments").select("*", { count: "exact", head: true }),
        supabase.from("curriculum_lesson_progress").select("*", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("curriculum_lessons").select("*", { count: "exact", head: true }).eq("status", "published"),
      ]);

      const completed = completedProgress.count ?? 0;
      const totalPossible = (enrollments.count ?? 0) * (publishedLessons.count ?? 0);
      const completionRate = totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0;

      return {
        totalEnrollments: enrollments.count ?? 0,
        lessonsCompleted: completed,
        completionRate,
      };
    },
  });
}
