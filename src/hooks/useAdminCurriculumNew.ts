import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

// Audit log helper — silently skips if no user
async function logAudit(
  adminUserId: string | undefined,
  action: string,
  entityType: string,
  entityId: string | null,
  beforeJson?: any,
  afterJson?: any
) {
  if (!adminUserId) return;
  await supabase.from("admin_audit_log").insert({
    admin_user_id: adminUserId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    before_json: beforeJson || null,
    after_json: afterJson || null,
  });
}

// ========== CURRICULUM SETTINGS ==========
export function useCurriculumSettings() {
  return useQuery({
    queryKey: ["admin-curriculum-settings"],
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

export function useSaveCurriculumSettings() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (settings: any) => {
      const { data: before } = await supabase
        .from("curriculum_settings")
        .select("*")
        .limit(1)
        .single();
      const { data, error } = await supabase
        .from("curriculum_settings")
        .update(settings)
        .eq("id", before!.id)
        .select()
        .single();
      if (error) throw error;
      await logAudit(user?.id, "update", "curriculum_settings", data.id, before, data);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-curriculum-settings"] });
      toast({ title: "Curriculum settings saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

// ========== WEEKS ==========
export function useWeeks() {
  return useQuery({
    queryKey: ["admin-weeks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weeks")
        .select("*")
        .order("order_index");
      if (error) throw error;
      return data;
    },
  });
}

export function useWeek(id: string | undefined) {
  return useQuery({
    queryKey: ["admin-week", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from("weeks").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useSaveWeek() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (week: any) => {
      const isNew = !week.id;
      if (isNew) {
        const { data, error } = await supabase.from("weeks").insert(week).select().single();
        if (error) throw error;
        await logAudit(user?.id, "create", "week", data.id, null, data);
        return data;
      } else {
        const { id, ...rest } = week;
        const { data: before } = await supabase.from("weeks").select("*").eq("id", id).single();
        const { data, error } = await supabase.from("weeks").update(rest).eq("id", id).select().single();
        if (error) throw error;
        await logAudit(user?.id, "update", "week", data.id, before, data);
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-weeks"] });
      toast({ title: "Week saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function usePublishWeek() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, publish }: { id: string; publish: boolean }) => {
      const { data: before } = await supabase.from("weeks").select("*").eq("id", id).single();
      const { data, error } = await supabase
        .from("weeks")
        .update({ status: publish ? "published" : "draft" })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      await logAudit(user?.id, publish ? "publish" : "unpublish", "week", id, before, data);
      return data;
    },
    onSuccess: (_, { publish }) => {
      qc.invalidateQueries({ queryKey: ["admin-weeks"] });
      toast({ title: publish ? "Week published" : "Week unpublished" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

// ========== CURRICULUM LESSONS ==========
export function useCurriculumLessons(weekId?: string) {
  return useQuery({
    queryKey: ["admin-curriculum-lessons", weekId],
    queryFn: async () => {
      if (!weekId) return [];
      const { data, error } = await supabase
        .from("curriculum_lessons")
        .select("*")
        .eq("week_id", weekId)
        .order("order_index");
      if (error) throw error;
      return data;
    },
    enabled: !!weekId,
  });
}

export function useCurriculumLesson(id: string | undefined) {
  return useQuery({
    queryKey: ["admin-curriculum-lesson", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from("curriculum_lessons").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useSaveCurriculumLesson() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (lesson: any) => {
      const isNew = !lesson.id;
      if (isNew) {
        const { data, error } = await supabase.from("curriculum_lessons").insert(lesson).select().single();
        if (error) throw error;
        await logAudit(user?.id, "create", "curriculum_lesson", data.id, null, data);
        return data;
      } else {
        const { id, ...rest } = lesson;
        const { data: before } = await supabase.from("curriculum_lessons").select("*").eq("id", id).single();
        const { data, error } = await supabase.from("curriculum_lessons").update(rest).eq("id", id).select().single();
        if (error) throw error;
        await logAudit(user?.id, "update", "curriculum_lesson", data.id, before, data);
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-curriculum-lessons"] });
      qc.invalidateQueries({ queryKey: ["admin-curriculum-lesson"] });
      toast({ title: "Lesson saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function usePublishCurriculumLesson() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, publish }: { id: string; publish: boolean }) => {
      const { data: before } = await supabase.from("curriculum_lessons").select("*").eq("id", id).single();
      const update: any = { status: publish ? "published" : "draft" };
      if (publish) update.published_at = new Date().toISOString();
      const { data, error } = await supabase.from("curriculum_lessons").update(update).eq("id", id).select().single();
      if (error) throw error;
      await logAudit(user?.id, publish ? "publish" : "unpublish", "curriculum_lesson", id, before, data);
      return data;
    },
    onSuccess: (_, { publish }) => {
      qc.invalidateQueries({ queryKey: ["admin-curriculum-lessons"] });
      qc.invalidateQueries({ queryKey: ["admin-curriculum-lesson"] });
      toast({ title: publish ? "Lesson published" : "Lesson unpublished" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteCurriculumLesson() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: before } = await supabase.from("curriculum_lessons").select("*").eq("id", id).single();
      const { error } = await supabase.from("curriculum_lessons").delete().eq("id", id);
      if (error) throw error;
      await logAudit(user?.id, "delete", "curriculum_lesson", id, before, null);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-curriculum-lessons"] });
      toast({ title: "Lesson deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDuplicateCurriculumLesson() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: original, error: fetchErr } = await supabase.from("curriculum_lessons").select("*").eq("id", id).single();
      if (fetchErr) throw fetchErr;
      const { id: _, created_at, updated_at, published_at, ...rest } = original;
      const { data, error } = await supabase
        .from("curriculum_lessons")
        .insert({ ...rest, title: `${rest.title} (copy)`, slug: `${rest.slug}-copy-${Date.now()}`, status: "draft", order_index: rest.order_index + 1 })
        .select()
        .single();
      if (error) throw error;
      await logAudit(user?.id, "duplicate", "curriculum_lesson", data.id, null, data);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-curriculum-lessons"] });
      toast({ title: "Lesson duplicated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

// ========== REORDER ==========
export function useReorderWeeks() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (items: { id: string; order_index: number }[]) => {
      for (const item of items) {
        await supabase.from("weeks").update({ order_index: item.order_index }).eq("id", item.id);
      }
      await logAudit(user?.id, "reorder", "weeks", null, null, items);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-weeks"] });
    },
  });
}

export function useReorderCurriculumLessons() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (items: { id: string; order_index: number }[]) => {
      for (const item of items) {
        await supabase.from("curriculum_lessons").update({ order_index: item.order_index }).eq("id", item.id);
      }
      await logAudit(user?.id, "reorder", "curriculum_lessons", null, null, items);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-curriculum-lessons"] });
    },
  });
}
