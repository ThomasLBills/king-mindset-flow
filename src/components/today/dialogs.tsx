import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormErrorSummary } from "@/components/form/FormErrorSummary";
import { SubmitButton } from "@/components/form/SubmitButton";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { useDailyCheckIn } from "@/hooks/useDailyProgress";
import { useEvidenceCounter } from "@/hooks/useEvidenceCounter";
import { useCompleteReflection } from "@/hooks/usePathToday";
import {
  ALL_FEELINGS,
  CORE_FEELINGS,
  feelingChipClass,
  needsSupportFor,
  scriptureFor,
} from "./checkInEngine";

/**
 * Daily check-in modal — the original mechanic, restyled for the Forge. Pick
 * ONE of 16 feelings; the matching Scripture surfaces immediately; an optional
 * "what is the Spirit saying" note can be added. The feeling/Scripture data and
 * derivation rules live in ./checkInEngine (shared with the inline CheckInCard).
 * Submitting writes to daily_check_ins via useDailyCheckIn with:
 *   - feelings: [the one selected id]
 *   - needsSupport: auto-derived from the feeling (never a manual input)
 *   - spiritResponse: the trimmed note or undefined
 * Idempotent per local day (the hook upserts on user_id+check_in_date); only
 * the FIRST check-in of the day logs an evidence_events "check_in" row.
 */

export const CheckInDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { isCheckedIn, submitCheckIn } = useDailyCheckIn();
  const { addEvidence } = useEvidenceCounter();
  const [feeling, setFeeling] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [note, setNote] = useState("");

  // A reopened dialog must not carry stale input.
  useEffect(() => {
    if (open) {
      setFeeling(null);
      setShowMore(false);
      setNote("");
    }
  }, [open]);

  const scripture = scriptureFor(feeling);
  const options = showMore ? ALL_FEELINGS : CORE_FEELINGS;

  const onSubmit = () => {
    if (!feeling) return;
    // Capture BEFORE submit: only the first check-in of the day logs evidence.
    const wasFirstCheckInToday = !isCheckedIn;
    submitCheckIn.mutate(
      {
        feelings: [feeling],
        needsSupport: needsSupportFor(feeling),
        spiritResponse: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          if (wasFirstCheckInToday) addEvidence.mutate("check_in");
          // No success toast: closing the dialog reveals the Today card flipped
          // to its "Checked in today" state with the saved content (P4). Failure
          // surfaces via the global mutation net.
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold uppercase tracking-wide">
            Daily check-in
          </DialogTitle>
          <DialogDescription>What is present in you right now?</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <div className="grid grid-cols-2 gap-2">
              {options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setFeeling((prev) => (prev === o.id ? null : o.id))}
                  className={cn(feelingChipClass(feeling === o.id))}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              className="mx-auto mt-3 block text-xs font-medium text-gold underline-offset-4 hover:underline"
            >
              {showMore ? "Show less" : "Show more"}
            </button>
          </div>

          {scripture && (
            <p className="rounded-md border border-line bg-raised px-4 py-3 font-serif text-sm italic leading-relaxed text-bone">
              “{scripture.text}”
              <span className="mt-1.5 block font-display text-[10px] not-italic tracking-[0.14em] text-gold">
                {scripture.ref.toUpperCase()}
              </span>
            </p>
          )}

          <div className="space-y-1.5">
            <label htmlFor="checkin-spirit" className="text-sm font-medium text-bone-2">
              What do you sense the Spirit saying about what you're feeling? (optional)
            </label>
            <Textarea
              id="checkin-spirit"
              rows={2}
              maxLength={280}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Name it and it loses weight…"
            />
          </div>

          <Button
            type="button"
            className="w-full"
            disabled={!feeling || submitCheckIn.isPending}
            onClick={onSubmit}
          >
            {submitCheckIn.isPending ? "Logging…" : "Log check-in"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const reflectionSchema = z.object({
  reflection: z.string().min(3, "A sentence is enough, but write something.").max(1000),
});

type ReflectionValues = z.infer<typeof reflectionSchema>;

export const ReflectionDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const mutation = useCompleteReflection();
  const form = useForm<ReflectionValues>({
    resolver: zodResolver(reflectionSchema),
    defaultValues: { reflection: "" },
  });

  useEffect(() => {
    if (open) form.reset({ reflection: "" });
  }, [open, form]);

  const onSubmit = () => {
    mutation.mutate(undefined, {
      onSuccess: () => {
        // The only in-place signal is a subtle path-step flip behind the closed
        // dialog, so confirm the save explicitly (P4). Failure → global net.
        notify.success("Reflection kept. Rest well.");
        onOpenChange(false);
        form.reset();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold uppercase tracking-wide">
            Evening reflection
          </DialogTitle>
          <DialogDescription>Where did you see God hold you today?</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormErrorSummary
              errors={form.formState.errors}
              submitCount={form.formState.submitCount}
            />
            <FormField
              control={form.control}
              name="reflection"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea rows={5} placeholder="Tonight I noticed…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SubmitButton className="w-full" pending={mutation.isPending} pendingLabel="Keeping…">
              Keep this reflection
            </SubmitButton>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
