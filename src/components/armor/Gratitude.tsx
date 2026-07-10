/**
 * "Gratitude — What Are You Grateful For Today?". Three required entries,
 * once per local day (gratitude_entries), then evidence "gratitude" via the
 * useGratitude hook. Independent of the check-in write.
 */
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/forge/atoms";
import { ErrorState, LoadingState } from "@/components/feedback";
import { BackTo } from "./frame";
import { useGratitude } from "@/hooks/useGratitude";
import { celebrate } from "@/lib/celebrate";

export const Gratitude = ({ onBack }: { onBack: () => void }) => {
  const { todayEntry, isLoading, isError, refetch, alreadySubmittedToday, submitGratitude } =
    useGratitude();
  const [e1, setE1] = useState("");
  const [e2, setE2] = useState("");
  const [e3, setE3] = useState("");
  const [done, setDone] = useState(false);

  if (isLoading) {
    return <LoadingState lines={4} />;
  }

  if (isError) {
    return (
      <>
        <ErrorState
          message="We couldn't load your gratitude for today."
          onRetry={() => refetch()}
        />
        <BackTo onClick={onBack} label="Back to Your Armor" />
      </>
    );
  }

  if (done || alreadySubmittedToday) {
    const entries = todayEntry
      ? [todayEntry.entry_1, todayEntry.entry_2, todayEntry.entry_3]
      : [e1, e2, e3];
    return (
      <>
        <Eyebrow tone="gold" className="mb-2">
          Gratitude
        </Eyebrow>
        <h1 className="font-display text-2xl font-bold tracking-tight text-bone">
          Gratitude recorded.
        </h1>
        <p className="mt-2 text-sm text-bone-2">Eyes trained on grace.</p>
        <ul className="mt-6 flex w-full flex-col gap-2 text-left">
          {entries.filter(Boolean).map((t, idx) => (
            <li
              key={idx}
              className="rounded-md border border-line bg-raised/80 px-4 py-3 font-serif text-sm italic text-bone"
            >
              “{t}”
            </li>
          ))}
        </ul>
        {alreadySubmittedToday && (
          <p className="mt-4 rounded-md border border-gold-deep bg-raised px-4 py-3 text-sm text-gold">
            You've already given thanks today. Come back tomorrow.
          </p>
        )}
        <BackTo onClick={onBack} label="Back to Your Armor" />
      </>
    );
  }

  const filled = e1.trim() && e2.trim() && e3.trim();
  const submit = () =>
    submitGratitude.mutate(
      { entry_1: e1.trim(), entry_2: e2.trim(), entry_3: e3.trim() },
      {
        // Success confirms in place: confetti + the recorded entries render
        // below (P4), so no toast. Failure surfaces via the global mutation
        // net (this was the origin silent-failure bug — now covered centrally).
        onSuccess: () => {
          celebrate();
          setDone(true);
        },
      }
    );

  return (
    <>
      <Eyebrow tone="gold" className="mb-2">
        Gratitude
      </Eyebrow>
      <h1 className="font-display text-2xl font-bold tracking-tight text-bone">
        What Are You Grateful For Today?
      </h1>
      <p className="mb-6 mt-2 text-sm text-bone-2">
        <span className="text-gold">Gratitude rewires how you see.</span> Name three things God has
        done today.
      </p>
      <div className="flex w-full flex-col gap-2.5">
        <Input value={e1} onChange={(e) => setE1(e.target.value)} placeholder="I'm grateful for..." />
        <Input value={e2} onChange={(e) => setE2(e.target.value)} placeholder="I'm grateful for..." />
        <Input value={e3} onChange={(e) => setE3(e.target.value)} placeholder="I'm grateful for..." />
      </div>
      <Button
        className="mt-6 w-full"
        size="lg"
        disabled={!filled || submitGratitude.isPending}
        onClick={submit}
      >
        {submitGratitude.isPending ? "Saving…" : "Complete Gratitude"}
      </Button>
      <BackTo onClick={onBack} label="Back to Your Armor" />
    </>
  );
};
