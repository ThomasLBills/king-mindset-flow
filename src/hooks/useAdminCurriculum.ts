import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

// Audit log helper
async function logAudit(
  adminUserId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  beforeJson?: any,
  afterJson?: any
) {
  await supabase.from("admin_audit_log").insert({
    admin_user_id: adminUserId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    before_json: beforeJson || null,
    after_json: afterJson || null,
  });
}

// ========== PROGRAMS ==========
export function usePrograms() {
  return useQuery({
    queryKey: ["admin-programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .order("order_index");
      if (error) throw error;
      return data;
    },
  });
}

// ========== COURSES ==========
export function useCourses(programId?: string) {
  return useQuery({
    queryKey: ["admin-courses", programId],
    queryFn: async () => {
      let q = supabase.from("courses").select("*").order("order_index");
      if (programId) q = q.eq("program_id", programId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useCourse(id: string | undefined) {
  return useQuery({
    queryKey: ["admin-course", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from("courses").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useSaveCourse() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (course: any) => {
      const isNew = !course.id;
      if (isNew) {
        const { data, error } = await supabase.from("courses").insert(course).select().single();
        if (error) throw error;
        await logAudit(user!.id, "create", "course", data.id, null, data);
        return data;
      } else {
        const { data: before } = await supabase.from("courses").select("*").eq("id", course.id).single();
        const { data, error } = await supabase.from("courses").update(course).eq("id", course.id).select().single();
        if (error) throw error;
        await logAudit(user!.id, "update", "course", data.id, before, data);
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      toast({ title: "Course saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: before } = await supabase.from("courses").select("*").eq("id", id).single();
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
      await logAudit(user!.id, "delete", "course", id, before, null);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      toast({ title: "Course deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

// ========== MODULES ==========
export function useModules(courseId?: string) {
  return useQuery({
    queryKey: ["admin-modules", courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const { data, error } = await supabase
        .from("modules")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index");
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });
}

export function useSaveModule() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (mod: any) => {
      const isNew = !mod.id;
      if (isNew) {
        const { data, error } = await supabase.from("modules").insert(mod).select().single();
        if (error) throw error;
        await logAudit(user!.id, "create", "module", data.id, null, data);
        return data;
      } else {
        const { data: before } = await supabase.from("modules").select("*").eq("id", mod.id).single();
        const { data, error } = await supabase.from("modules").update(mod).eq("id", mod.id).select().single();
        if (error) throw error;
        await logAudit(user!.id, "update", "module", data.id, before, data);
        return data;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-modules"] });
      toast({ title: "Module saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteModule() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: before } = await supabase.from("modules").select("*").eq("id", id).single();
      const { error } = await supabase.from("modules").delete().eq("id", id);
      if (error) throw error;
      await logAudit(user!.id, "delete", "module", id, before, null);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-modules"] });
      toast({ title: "Module deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

// ========== LESSONS ==========
export function useLessons(moduleId?: string) {
  return useQuery({
    queryKey: ["admin-lessons", moduleId],
    queryFn: async () => {
      if (!moduleId) return [];
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("module_id", moduleId)
        .order("order_index");
      if (error) throw error;
      return data;
    },
    enabled: !!moduleId,
  });
}

export function useLesson(id: string | undefined) {
  return useQuery({
    queryKey: ["admin-lesson", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from("lessons").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useSaveLesson() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (lesson: any) => {
      const isNew = !lesson.id;
      if (isNew) {
        const { data, error } = await supabase.from("lessons").insert(lesson).select().single();
        if (error) throw error;
        await logAudit(user!.id, "create", "lesson", data.id, null, data);
        return data;
      } else {
        const { data: before } = await supabase.from("lessons").select("*").eq("id", lesson.id).single();
        const { data, error } = await supabase.from("lessons").update(lesson).eq("id", lesson.id).select().single();
        if (error) throw error;
        await logAudit(user!.id, "update", "lesson", data.id, before, data);
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-lessons"] });
      qc.invalidateQueries({ queryKey: ["admin-lesson"] });
      toast({ title: "Lesson saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function usePublishLesson() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, publish }: { id: string; publish: boolean }) => {
      const { data: before } = await supabase.from("lessons").select("*").eq("id", id).single();
      const update: any = { status: publish ? "published" : "draft" };
      if (publish) update.published_at = new Date().toISOString();
      const { data, error } = await supabase.from("lessons").update(update).eq("id", id).select().single();
      if (error) throw error;

      // Create version snapshot on publish
      if (publish) {
        const { count } = await supabase
          .from("curriculum_versions")
          .select("*", { count: "exact", head: true })
          .eq("entity_type", "lesson")
          .eq("entity_id", id);
        await supabase.from("curriculum_versions").insert({
          entity_type: "lesson",
          entity_id: id,
          version_number: (count || 0) + 1,
          snapshot_json: data,
          created_by: user!.id,
          published: true,
          published_at: new Date().toISOString(),
        });
      }

      await logAudit(user!.id, publish ? "publish" : "unpublish", "lesson", id, before, data);
      return data;
    },
    onSuccess: (_, { publish }) => {
      qc.invalidateQueries({ queryKey: ["admin-lessons"] });
      qc.invalidateQueries({ queryKey: ["admin-lesson"] });
      toast({ title: publish ? "Lesson published" : "Lesson unpublished" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteLesson() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: before } = await supabase.from("lessons").select("*").eq("id", id).single();
      const { error } = await supabase.from("lessons").delete().eq("id", id);
      if (error) throw error;
      await logAudit(user!.id, "delete", "lesson", id, before, null);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-lessons"] });
      toast({ title: "Lesson deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDuplicateLesson() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: original, error: fetchErr } = await supabase.from("lessons").select("*").eq("id", id).single();
      if (fetchErr) throw fetchErr;
      const { id: _, created_at, updated_at, published_at, ...rest } = original;
      const { data, error } = await supabase
        .from("lessons")
        .insert({ ...rest, title: `${rest.title} (copy)`, slug: `${rest.slug}-copy-${Date.now()}`, status: "draft", order_index: rest.order_index + 1 })
        .select()
        .single();
      if (error) throw error;
      await logAudit(user!.id, "duplicate", "lesson", data.id, null, data);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-lessons"] });
      toast({ title: "Lesson duplicated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

// ========== ANNOUNCEMENTS ==========
export function useAnnouncements() {
  return useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveAnnouncement() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (ann: any) => {
      const isNew = !ann.id;
      if (isNew) {
        const { data, error } = await supabase.from("announcements").insert({ ...ann, created_by: user!.id }).select().single();
        if (error) throw error;
        await logAudit(user!.id, "create", "announcement", data.id, null, data);
        return data;
      } else {
        const { data, error } = await supabase.from("announcements").update(ann).eq("id", ann.id).select().single();
        if (error) throw error;
        await logAudit(user!.id, "update", "announcement", data.id, null, data);
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
      toast({ title: "Announcement saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

// ========== AUDIT LOG ==========
export function useAuditLog(limit = 50) {
  return useQuery({
    queryKey: ["admin-audit-log", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });
}

// ========== ADMIN STATS ==========
export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [profiles, entitlements, courses, lessons] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("entitlements").select("*", { count: "exact", head: true }).eq("active", true),
        supabase.from("courses").select("*", { count: "exact", head: true }),
        supabase.from("lessons").select("*", { count: "exact", head: true }).eq("status", "published"),
      ]);
      return {
        totalUsers: profiles.count || 0,
        activeEntitlements: entitlements.count || 0,
        totalCourses: courses.count || 0,
        publishedLessons: lessons.count || 0,
      };
    },
  });
}

// ========== REORDER ==========
export function useReorder(table: "courses" | "modules" | "lessons") {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (items: { id: string; order_index: number }[]) => {
      for (const item of items) {
        await supabase.from(table).update({ order_index: item.order_index }).eq("id", item.id);
      }
      await logAudit(user!.id, "reorder", table, null, null, items);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [`admin-${table}`] });
    },
  });
}
