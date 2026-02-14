import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
