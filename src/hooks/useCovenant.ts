/**
 * Covenant + "your why" — NEW features from the Forge redesign (see
 * src/features.ts). One row per user in user_covenants:
 *   user_id (pk) · why text · signed_name text · signed_at timestamptz
 * Migration: supabase/migrations/*_user_covenants*. Table type not yet in the
 * generated types.ts, hence the `as any` casts (same pattern as useGratitude).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CovenantRow {
  user_id: string;
  why: string | null;
  signed_name: string | null;
  signed_at: string | null;
}

const KEY = "user-covenant";

export const useCovenant = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: [KEY, user?.id],
    enabled: !!user,
    queryFn: async (): Promise<CovenantRow | null> => {
      const { data, error } = await (supabase as any)
        .from("user_covenants")
        .select("user_id, why, signed_name, signed_at")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
};

const useUpsertCovenant = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Omit<CovenantRow, "user_id">>) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await (supabase as any)
        .from("user_covenants")
        .upsert({ user_id: user.id, ...patch }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
};

export const useSetWhy = () => {
  const upsert = useUpsertCovenant();
  return {
    ...upsert,
    mutate: (why: string, opts?: Parameters<typeof upsert.mutate>[1]) =>
      upsert.mutate({ why: why.trim() }, opts),
  };
};

export const useSealCovenant = () => {
  const upsert = useUpsertCovenant();
  return {
    ...upsert,
    mutate: (signedName: string, opts?: Parameters<typeof upsert.mutate>[1]) =>
      upsert.mutate({ signed_name: signedName.trim(), signed_at: new Date().toISOString() }, opts),
  };
};
