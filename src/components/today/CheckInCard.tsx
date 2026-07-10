import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDailyCheckIn } from "@/hooks/useDailyProgress";
import { useEvidenceCounter } from "@/hooks/useEvidenceCounter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Eyebrow, SectionCard } from "@/components/forge/atoms";
import { LkSeal } from "@/components/forge/brand";
import {
  ALL_FEELINGS,
  CORE_FEELINGS,
  feelingChipClass,
  feelingLabel,
  needsSupportFor,
  scriptureFor,
  type Scripture,
} from "./checkInEngine";

/**
 * Daily Check-In: the primary card on Today (replaces the old "Standing"
 * hero). It is the ORIGINAL mechanic rendered inline: pick ONE of 16 feelings
 * (4 core + "show more" for 12 extra), the matching priority Scripture surfaces
 * on select, an optional "what is the Spirit saying" note, then submit.
 *
 * Data contract (shared with CheckInDialog, must not drift):
 *  - writes daily_check_ins via useDailyCheckIn with feelings:[feeling],
 *    needsSupport auto-derived, spiritResponse trimmed-or-undefined
 *  - idempotent per local day (hook upserts on user_id+check_in_date)
 *  - only the FIRST check-in of the day logs evidence_events "check_in"
 */

const VerseBlock = ({ scripture }: { scripture: Scripture }) => (
  <p className="rounded-md border border-line bg-raised px-4 py-3 font-serif text-sm italic leading-relaxed text-bone">
    “{scripture.text}”
    <span className="mt-1.5 block font-display text-[10px] not-italic tracking-[0.14em] text-gold">
      {scripture.ref.toUpperCase()}
    </span>
  </p>
);

export const CheckInCard = () => {
  const { isCheckedIn, todayCheckIn, isLoading, submitCheckIn } = useDailyCheckIn();
  const { addEvidence } = useEvidenceCounter();

  const [editing, setEditing] = useState(false);
  const [feeling, setFeeling] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [note, setNote] = useState("");

  const scripture = scriptureFor(feeling);
  const options = showMore ? ALL_FEELINGS : CORE_FEELINGS;

  const startEdit = () => {
    setFeeling(null);
    setShowMore(false);
    setNote("");
    setEditing(true);
  };

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
          // No success toast: the card flips to the compact "Checked in today"
          // state showing the saved feelings + Scripture in place (P4). Failure
          // surfaces via the global mutation net.
          setEditing(false);
        },
      }
    );
  };

  const showCompact = isCheckedIn && !editing;

  // In the compact state, surface the verse for the first stored feeling that
  // maps to Scripture (older rows may hold unmapped values, that's fine).
  const storedFeelings: string[] = Array.isArray(todayCheckIn?.feelings)
    ? todayCheckIn!.feelings
    : [];
  const compactScripture =
    storedFeelings.map(scriptureFor).find((s): s is Scripture => s !== null) ?? null;

  return (
    <SectionCard hatch className="p-5 sm:p-6">
      <LkSeal className="pointer-events-none absolute -right-7 -top-7 h-32 w-32 text-gold opacity-[0.06]" />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        </div>
      ) : showCompact ? (
        <div>
          <Eyebrow tone="gold" className="mb-2 flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            Checked in today
          </Eyebrow>
          <p className="text-sm text-bone-2">
            You named what’s present. Carry the Word with you today.
          </p>

          {storedFeelings.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="How you're feeling today">
              {storedFeelings.map((id) => (
                <li
                  key={id}
                  className="rounded-full border border-gold-deep bg-raised-2 px-3 py-1 text-xs font-medium text-gold-bright"
                >
                  {feelingLabel(id)}
                </li>
              ))}
            </ul>
          )}

          {compactScripture && (
            <div className="mt-4">
              <VerseBlock scripture={compactScripture} />
            </div>
          )}

          <button
            type="button"
            onClick={startEdit}
            className="mt-4 text-sm font-medium text-gold underline-offset-4 hover:underline"
          >
            Check in again →
          </button>
        </div>
      ) : (
        <div>
          <Eyebrow tone="gold" className="mb-1 block">
            Daily check-in
          </Eyebrow>
          <p className="mb-4 text-sm text-bone-2">What is present in you right now?</p>

          <div className="grid grid-cols-2 gap-2">
            {options.map((o) => (
              <button
                key={o.id}
                type="button"
                aria-pressed={feeling === o.id}
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

          {scripture && (
            <div className="mt-5">
              <VerseBlock scripture={scripture} />
            </div>
          )}

          <div className="mt-5 space-y-1.5">
            <label htmlFor="checkin-card-spirit" className="text-sm font-medium text-bone-2">
              What do you sense the Spirit saying about what you’re feeling? (optional)
            </label>
            <Textarea
              id="checkin-card-spirit"
              rows={2}
              maxLength={280}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Name it and it loses weight…"
            />
          </div>

          <div className="mt-5 flex items-center gap-3">
            <Button
              type="button"
              className="flex-1"
              disabled={!feeling || submitCheckIn.isPending}
              onClick={onSubmit}
            >
              {submitCheckIn.isPending ? "Logging…" : "Log check-in"}
            </Button>
            {editing && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditing(false)}
                disabled={submitCheckIn.isPending}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  );
};
