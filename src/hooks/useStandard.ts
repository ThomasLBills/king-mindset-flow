/**
 * The Return after a fall. The original R.E.T.U.R.N. tool fires three writes
 * together on the final "Hold to Return":
 *   1. relapse_events insert  (for the record + trigger-pattern insight)
 *   2. freedom_streaks upsert  (resets start_date to today, onConflict user_id)
 *   3. evidence_events insert  (event_type "grace_protocol_complete")
 * useReturn restores that exact behavior so the Liberated KPI and any
 * streak-consuming surface stay correct. useRecordFall is kept for callers
 * that only need the relapse log.
 */
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEvidenceCounter } from "@/hooks/useEvidenceCounter";
import { useRelapseEventLogger } from "@/hooks/useTriggerPatterns";

const getLocalDate = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

/** Log a fall to relapse_events only (no streak reset, no evidence). */
export const useRecordFall = () => {
  const { logRelapseEvent } = useRelapseEventLogger();
  return useMutation({
    mutationFn: async () => {
      await logRelapseEvent.mutateAsync();
    },
  });
};

/** The full R.E.T.U.R.N. completion: relapse log + streak reset + evidence. */
export const useReturn = () => {
  const { user } = useAuth();
  const { logRelapseEvent } = useRelapseEventLogger();
  const { addEvidence } = useEvidenceCounter();
  return useMutation({
    mutationFn: async () => {
      await logRelapseEvent.mutateAsync();
      if (user) {
        const { error } = await supabase.from("freedom_streaks").upsert(
          { user_id: user.id, start_date: getLocalDate(), updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );
        if (error) throw error;
      }
      await addEvidence.mutateAsync("grace_protocol_complete");
    },
  });
};
