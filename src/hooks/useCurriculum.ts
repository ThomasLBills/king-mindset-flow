import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// ========== PUBLISHED CURRICULUM (user-facing) ==========

export function useCurriculumSettings() {
  return useQuery({
    queryKey: ["curriculum-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curriculum_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function usePublishedWeeks() {
  return useQuery({
    queryKey: ["published-weeks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weeks")
        .select("*")
        .eq("status", "published")
        .order("order_index");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAllWeeks() {
  return useQuery({
    queryKey: ["all-weeks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weeks")
        .select("*")
        .order("order_index");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePublishedCurriculumLessons(weekId: string | undefined) {
  return useQuery({
    queryKey: ["published-curriculum-lessons", weekId],
    enabled: !!weekId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curriculum_lessons")
        .select("*")
        .eq("week_id", weekId!)
        .eq("status", "published")
        .order("order_index");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAllPublishedCurriculumLessons() {
  return useQuery({
    queryKey: ["all-published-curriculum-lessons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curriculum_lessons")
        .select("*")
        .eq("status", "published")
        .order("order_index");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCurriculumLessonProgress() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-curriculum-lesson-progress"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curriculum_lesson_progress")
        .select("lesson_id, status, percent");
      if (error) throw error;
      return new Map((data ?? []).map(lp => [lp.lesson_id, lp]));
    },
  });
}

export function useUserEnrollment() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-enrollment"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_enrollments")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useEnroll() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("user_enrollments")
        .insert({ user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-enrollment"] });
    },
  });
}

export function useMarkLessonComplete() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (lessonId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("curriculum_lesson_progress")
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          status: "completed",
          percent: 100,
          completed_at: new Date().toISOString(),
          last_viewed_at: new Date().toISOString(),
        }, { onConflict: "user_id,lesson_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-curriculum-lesson-progress"] });
    },
  });
}

// ========== LEGACY (courses/modules/lessons) - keep for backward compat ==========

export function usePublishedCourses() {
  return useQuery({
    queryKey: ["published-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("status", "published")
        .order("order_index");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePublishedModules(courseId: string | undefined) {
  return useQuery({
    queryKey: ["published-modules", courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select("*")
        .eq("course_id", courseId!)
        .eq("status", "published")
        .order("order_index");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePublishedLessons(moduleId: string | undefined) {
  return useQuery({
    queryKey: ["published-lessons", moduleId],
    enabled: !!moduleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("module_id", moduleId!)
        .eq("status", "published")
        .order("order_index");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useLessonProgress() {
  return useQuery({
    queryKey: ["my-lesson-progress"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lesson_progress")
        .select("lesson_id, status, percent");
      if (error) throw error;
      return new Map((data ?? []).map(lp => [lp.lesson_id, lp]));
    },
  });
}

export function useCourseProgress() {
  return useQuery({
    queryKey: ["my-course-progress"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_progress")
        .select("course_id, percent");
      if (error) throw error;
      return new Map((data ?? []).map(cp => [cp.course_id, cp]));
    },
  });
}
