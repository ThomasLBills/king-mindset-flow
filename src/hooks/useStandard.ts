/**
 * Recording a fall - NOT a streak. The Forge deliberately keeps no
 * abstinence scoreboard (no days-held, no longest run): counting days since
 * porn frames a son as a slave measuring his cage. A fall is still logged to
 * relapse_events (the same table the original R.E.T.U.R.N. tool uses) so the
 * "return without hiding" flow and trigger-pattern insights keep working -
 * but nothing surfaces it as a running count.
 */
import { useMutation } from "@tanstack/react-query";
import { useRelapseEventLogger } from "@/hooks/useTriggerPatterns";

/**
 * The return after a fall: log it for the record and for pattern insight,
 * then let grace carry the rest. Nothing member-facing reads it as a count,
 * so there is no counter to reset.
 */
export const useRecordFall = () => {
  const { logRelapseEvent } = useRelapseEventLogger();
  return useMutation({
    mutationFn: async () => {
      await logRelapseEvent.mutateAsync();
    },
  });
};
