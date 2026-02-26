import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEvidenceCounter } from "./useEvidenceCounter";

const getLocalDateString = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

export function useGratitude() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { addEvidence } = useEvidenceCounter();

  const todayStr = getLocalDateString();

  const { data: todayEntry, isLoading } = useQuery({
    queryKey: ["gratitude-today", user?.id, todayStr],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gratitude_entries" as any)
        .select("*")
        .eq("user_id", user!.id)
        .eq("entry_date", todayStr)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as { entry_1: string; entry_2: string; entry_3: string } | null;
    },
  });

  const submitGratitude = useMutation({
    mutationFn: async (entries: { entry_1: string; entry_2: string; entry_3: string }) => {
      if (!user) return;
      const { error } = await supabase
        .from("gratitude_entries" as any)
        .insert({
          user_id: user.id,
          entry_date: todayStr,
          ...entries,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gratitude-today"] });
      // 3 entries = 3 evidence pieces
      addEvidence.mutate("gratitude");
      addEvidence.mutate("gratitude");
      addEvidence.mutate("gratitude");
    },
  });

  return {
    todayEntry,
    isLoading,
    alreadySubmittedToday: !!todayEntry,
    submitGratitude,
  };
}
