import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Flame,
  Heart,
  MessageSquare,
  ShieldCheck,
  Undo2,
  Wind,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FEATURES } from "@/features";
import { useCovenant } from "@/hooks/useCovenant";
import { useForgeUser } from "@/hooks/useForgeProfile";
import { useGroup, useRaiseBanner } from "@/hooks/useForgeGroup";
import { useDeclarations } from "@/hooks/useDeclarations";
import { useUrgeCounter } from "@/hooks/useUrgeCounter";
import { useRecordFall } from "@/hooks/useStandard";
import { useCrisisEventLogger } from "@/hooks/useTriggerPatterns";
import { FIGHTING_VERSES } from "@/data/scriptureLibrary";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Eyebrow, InitialsAvatar } from "@/components/forge/atoms";
import { HoldButton } from "@/components/forge/HoldButton";
import { LkMonogram } from "@/components/forge/brand";
import { Grain, SceneFigure } from "@/components/forge/scenes";

type View =
  | "triage"
  | "menu"
  | "call"
  | "sent"
  | "word"
  | "why"
  | "move"
  | "fall-truth"
  | "fall-trace"
  | "fall-commit"
  | "fall-done";

/** Slow expand/settle breathing ring. Static under reduced motion. */
const BreathingPacer = () => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      animate={reduce ? undefined : { scale: [0.86, 1.12, 1.12, 0.86] }}
      transition={
        reduce
          ? undefined
          : { duration: 11, times: [0, 0.45, 0.55, 1], repeat: Infinity, ease: "easeInOut" }
      }
      className="relative mb-3 grid h-36 w-36 place-items-center rounded-full border-[1.5px] border-gold-deep sm:h-40 sm:w-40"
    >
      <div
        className="absolute inset-3.5 rounded-full border border-line bg-[radial-gradient(circle,hsl(38_45%_10%),hsl(35_30%_6%))]"
        aria-hidden="true"
      />
      <span className="relative font-display text-xs uppercase tracking-[0.16em] text-gold-bright">
        Breathe
      </span>
    </motion.div>
  );
};

const ActionRow = ({
  icon: Icon,
  title,
  sub,
  primary = false,
  onClick,
}: {
  icon: typeof Flame;
  title: string;
  sub: string;
  primary?: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex w-full items-center gap-3.5 rounded-lg border p-4 text-left transition-colors",
      primary
        ? "border-gold-deep bg-gradient-to-b from-[hsl(24_41%_12%)] to-[hsl(26_45%_9%)]"
        : "border-line bg-raised hover:border-gold-deep hover:bg-raised-2"
    )}
  >
    <Icon className="h-[22px] w-[22px] shrink-0 text-gold" aria-hidden="true" />
    <span>
      <b className={cn("block text-[15px] font-semibold", primary ? "text-gold-bright" : "text-bone")}>
        {title}
      </b>
      <span className="text-xs text-bone-2">{sub}</span>
    </span>
  </button>
);

const BackTo = ({ onClick, label = "Back" }: { onClick: () => void; label?: string }) => (
  <button
    onClick={onClick}
    className="mx-auto mt-6 flex items-center gap-1.5 text-sm text-dim transition-colors hover:text-bone-2"
  >
    <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {label}
  </button>
);

const TRACE_QUESTIONS = [
  "When did it actually start? (Not the click. The drift.)",
  "What opened the door: tired, alone, stressed, hungry?",
  "What were you feeling an hour before?",
];

/** Client-approved copy for the "raise the banner" prayer request. */
const PRAYER_TEMPLATES = [
  "Brothers, the pull is strong right now. Stand with me.",
  "In the fight this hour. Pray I hold the line.",
  "Tempted and tired. I'm not hiding it. Pray for me.",
];

const StandFirm = () => {
  const navigate = useNavigate();
  const { data: covenant } = useCovenant();
  const why = covenant?.why;
  const { user } = useForgeUser();
  const { data: group } = useGroup();
  const { declarations } = useDeclarations();
  const raiseBanner = useRaiseBanner();
  const { addUrge } = useUrgeCounter();
  const recordFall = useRecordFall();
  const { logCrisisEvent } = useCrisisEventLogger();

  const [view, setView] = useState<View>("triage");
  const [selected, setSelected] = useState<string[]>([]);
  const [template, setTemplate] = useState(PRAYER_TEMPLATES[0]);
  const [verseIndex, setVerseIndex] = useState(0);
  const [commitReach, setCommitReach] = useState(false);
  const [commitRhythms, setCommitRhythms] = useState(false);

  const brothers = (group?.members ?? []).filter((m) => m.id !== user?.id);
  const allIds = brothers.map((b) => b.id);
  const effectiveSelected = selected.length ? selected : allIds;

  const steady = () => {
    addUrge.mutate(undefined, {
      onSuccess: () => toast.success("That's who you are now. Well stood."),
    });
    navigate("/app");
  };

  const triage = (feeling: string, next: View) => {
    logCrisisEvent.mutate(feeling);
    setView(next);
  };

  const verse = FIGHTING_VERSES[verseIndex % FIGHTING_VERSES.length];

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-forge px-6 py-12 text-center">
      <SceneFigure className="opacity-90" />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_42%,hsl(34_21%_6%/0.35),hsl(30_33%_4%/0.92))]"
        aria-hidden="true"
      />
      <Grain />

      <Link
        to="/app"
        aria-label="Leave, back to Today"
        className="absolute right-5 top-5 z-10 rounded-full border border-line bg-raised/60 p-2 text-dim transition-colors hover:text-bone"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </Link>

      <div className="relative z-10 flex w-full max-w-[420px] flex-col items-center">
        <LkMonogram className="mb-4 h-6 w-8 opacity-90" />

        {view === "triage" && (
          <>
            <Eyebrow tone="gold" className="mb-3">
              Stand firm
            </Eyebrow>
            <h1 className="font-display text-4xl font-bold tracking-tight text-bone">
              You're here. Good.
            </h1>
            <p className="mx-auto mb-7 mt-3 max-w-[340px] text-[15px] leading-relaxed text-bone-2">
              One honest answer, and you get the right help. What's going on right now?
            </p>
            <div className="flex w-full flex-col gap-2.5">
              <ActionRow
                icon={Wind}
                title="I'm being tempted"
                sub="Ride the wave out with help"
                primary
                onClick={() => triage("tempted", "menu")}
              />
              <ActionRow
                icon={Undo2}
                title="I already fell"
                sub="Come back quickly, without hiding"
                onClick={() => triage("already fell", "fall-truth")}
              />
              <ActionRow
                icon={BookOpen}
                title="I'm anxious or heavy"
                sub="Stand on the Word for a minute"
                onClick={() => triage("anxious", "word")}
              />
              <ActionRow
                icon={Heart}
                title="I'm steady, just grounding"
                sub="Remember what this is all for"
                onClick={() => triage("grounding", "why")}
              />
            </div>
          </>
        )}

        {view === "menu" && (
          <>
            <Eyebrow tone="gold" className="mb-3">
              Stand firm
            </Eyebrow>
            <h1 className="font-display text-4xl font-bold tracking-tight text-bone sm:text-5xl">
              This will pass.
            </h1>
            <p className="mx-auto mb-7 mt-3 max-w-[360px] text-[15px] leading-relaxed text-bone-2">
              Most urges crest and fall within minutes. Breathe here with me. You don't have to
              fight this alone.
            </p>
            {FEATURES.breathingPacer && <BreathingPacer />}
            <div className="mt-6 flex w-full flex-col gap-2.5">
              <ActionRow
                icon={MessageSquare}
                title="Call the brothers"
                sub={`Sends a prayer request to ${group?.name ?? "your brothers"} right now`}
                primary
                onClick={() => setView("call")}
              />
              <ActionRow
                icon={BookOpen}
                title="Stand on the Word"
                sub="A verse to fight with"
                onClick={() => setView("word")}
              />
              {FEATURES.rememberWhy && (
                <ActionRow
                  icon={Heart}
                  title="Remember your why"
                  sub={why ? `The reason you wrote down: “${why}”` : "The reason you're doing this"}
                  onClick={() => setView("why")}
                />
              )}
              {FEATURES.moveYourBody && (
                <ActionRow
                  icon={Flame}
                  title="Move your body"
                  sub="Get up. 20 push-ups, or step outside for air."
                  onClick={() => setView("move")}
                />
              )}
            </div>
            <button
              onClick={steady}
              className="mt-6 border-b border-transparent pb-0.5 text-[13px] text-dim transition-colors hover:border-line hover:text-bone-2"
            >
              I'm steady now →
            </button>
            <BackTo onClick={() => setView("triage")} />
          </>
        )}

        {view === "call" && (
          <>
            <Eyebrow tone="gold" className="mb-3">
              Raise the banner
            </Eyebrow>
            <h1 className="font-display text-3xl font-bold tracking-tight text-bone">
              Your brothers want this call.
            </h1>
            <p className="mb-6 mt-2 text-sm text-bone-2">
              This logs the urge and sends a prayer request. You don't need to explain anything.
              The banner says enough.
            </p>
            <fieldset className="w-full text-left">
              <legend className="sr-only">Send to</legend>
              <ul className="mb-4 flex flex-col gap-1.5">
                {brothers.map((b) => {
                  const checked = effectiveSelected.includes(b.id);
                  return (
                    <li key={b.id}>
                      <label className="flex cursor-pointer items-center gap-3 rounded-md border border-line bg-raised/80 px-3 py-2.5 text-sm text-bone">
                        <Checkbox
                          checked={checked}
                          className="h-5 w-5 border-gold"
                          onCheckedChange={(next) =>
                            setSelected(
                              next
                                ? [...new Set([...effectiveSelected, b.id])]
                                : effectiveSelected.filter((id) => id !== b.id)
                            )
                          }
                        />
                        <InitialsAvatar initials={b.initials} tone="raised" className="h-7 w-7 text-[11px]" />
                        {b.name}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
            <fieldset className="w-full text-left">
              <legend className="sr-only">Message</legend>
              <div className="flex flex-col gap-1.5">
                {PRAYER_TEMPLATES.map((t) => (
                  <label
                    key={t}
                    className={cn(
                      "cursor-pointer rounded-md border px-3 py-2.5 font-serif text-sm italic",
                      template === t
                        ? "border-gold-deep bg-raised-2 text-bone"
                        : "border-line bg-raised/80 text-bone-2"
                    )}
                  >
                    <input
                      type="radio"
                      name="template"
                      className="sr-only"
                      checked={template === t}
                      onChange={() => setTemplate(t)}
                    />
                    “{t}”
                  </label>
                ))}
              </div>
            </fieldset>
            <HoldButton
              className="mt-5"
              disabled={raiseBanner.isPending || effectiveSelected.length === 0}
              onComplete={() =>
                raiseBanner.mutate(
                  { brotherIds: effectiveSelected, template },
                  { onSuccess: () => setView("sent") }
                )
              }
            >
              {raiseBanner.isPending
                ? "Raising the banner…"
                : `Hold to send · ${effectiveSelected.length} brothers`}
            </HoldButton>
            <BackTo onClick={() => setView("menu")} />
          </>
        )}

        {view === "sent" && (
          <>
            <Eyebrow tone="gold" className="mb-3">
              The banner is raised
            </Eyebrow>
            <h1 className="font-display text-3xl font-bold tracking-tight text-bone">
              They're being told right now.
            </h1>
            <p className="mb-8 mt-3 max-w-[340px] text-[15px] leading-relaxed text-bone-2">
              You did the strong thing. You didn't hide. Keep breathing, answers usually come
              within minutes.
            </p>
            {FEATURES.breathingPacer && <BreathingPacer />}
            <HoldButton className="mt-6" onComplete={steady}>
              Hold when steady
            </HoldButton>
            <BackTo onClick={() => setView("menu")} />
          </>
        )}

        {view === "word" && verse && (
          <>
            <Eyebrow tone="gold" className="mb-6">
              Stand on the Word
            </Eyebrow>
            <blockquote>
              <p className="font-serif text-2xl italic leading-relaxed text-bone sm:text-[26px]">
                “{verse.text}”
              </p>
              <footer className="mt-4">
                <Eyebrow tone="gold">{verse.ref}</Eyebrow>
              </footer>
            </blockquote>
            {declarations.length > 0 && (
              <div className="mt-8 w-full text-left">
                <Eyebrow className="mb-2 block text-center">Your declarations</Eyebrow>
                <ul className="flex flex-col gap-1.5">
                  {declarations.map((d) => (
                    <li
                      key={d.id}
                      className="rounded-md border border-line bg-raised/80 px-4 py-2.5 font-serif text-sm italic text-bone"
                    >
                      “{d.declaration_text}”
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-8 flex w-full gap-2.5">
              <Button variant="outline" className="flex-1" onClick={() => setVerseIndex((i) => i + 1)}>
                Another verse
              </Button>
              <Button className="flex-1" onClick={steady}>
                I'm steady now
              </Button>
            </div>
            <p className="mt-6 text-[10px] leading-relaxed text-dim">
              Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.
            </p>
            <BackTo onClick={() => setView("triage")} />
          </>
        )}

        {view === "why" && (
          <>
            <Eyebrow tone="gold" className="mb-6">
              Remember your why
            </Eyebrow>
            {why ? (
              <p className="font-serif text-3xl italic leading-snug text-bone">“{why}”</p>
            ) : (
              <p className="max-w-[340px] font-serif text-xl italic leading-relaxed text-bone-2">
                You haven't written your reason down yet, but you have one. When this passes, put
                it into words in your profile. It will fight for you next time.
              </p>
            )}
            <Button className="mt-8 w-full" size="lg" onClick={steady}>
              I'm steady now
            </Button>
            <BackTo onClick={() => setView("triage")} />
          </>
        )}

        {view === "move" && (
          <>
            <Eyebrow tone="gold" className="mb-6">
              Move your body
            </Eyebrow>
            <h1 className="font-display text-3xl font-bold tracking-tight text-bone">
              Get up. Right now.
            </h1>
            <ul className="mt-6 flex w-full max-w-[320px] flex-col gap-2.5 text-left">
              {["Twenty push-ups. Count them out loud.", "Step outside. Cold air, two minutes.", "Cold water on your face and wrists."].map(
                (item) => (
                  <li
                    key={item}
                    className="rounded-md border border-line bg-raised/80 px-4 py-3 text-sm text-bone"
                  >
                    {item}
                  </li>
                )
              )}
            </ul>
            <p className="mt-5 text-sm text-bone-2">
              The urge lives in a still body. Move, and it loses its grip.
            </p>
            <Button className="mt-6 w-full" size="lg" onClick={steady}>
              Done. I'm steady now
            </Button>
            <BackTo onClick={() => setView("menu")} />
          </>
        )}

        {/* ---- The Return: for the man who already fell ---- */}

        {view === "fall-truth" && (
          <>
            <Eyebrow tone="gold" className="mb-3">
              The return · 1 of 3
            </Eyebrow>
            <h1 className="font-display text-3xl font-bold tracking-tight text-bone sm:text-4xl">
              There is no condemnation here.
            </h1>
            <blockquote className="mt-5">
              <p className="font-serif text-lg italic leading-relaxed text-bone">
                “There is therefore now no condemnation for those who are in Christ Jesus.”
              </p>
              <footer className="mt-2">
                <Eyebrow tone="gold">Romans 8:1</Eyebrow>
              </footer>
            </blockquote>
            <p className="mx-auto mt-5 max-w-[360px] text-[15px] leading-relaxed text-bone-2">
              The fall does not define you. What you do in the next ten minutes matters more than
              what happened in the last ten. Pray this out loud, in your own words or these:
            </p>
            <p className="mt-4 rounded-md border border-line bg-raised/80 px-5 py-4 font-serif italic text-bone">
              “Father, I'm not hiding. I'm coming back. Receive me as a son.”
            </p>
            <Button className="mt-7 w-full" size="lg" onClick={() => setView("fall-trace")}>
              Continue
            </Button>
            <BackTo onClick={() => setView("triage")} />
          </>
        )}

        {view === "fall-trace" && (
          <>
            <Eyebrow tone="gold" className="mb-3">
              The return · 2 of 3
            </Eyebrow>
            <h1 className="font-display text-3xl font-bold tracking-tight text-bone">
              Data, not condemnation.
            </h1>
            <p className="mb-5 mt-2 text-sm text-bone-2">
              Trace what happened so it teaches you something. Failure is feedback.
            </p>
            <ul className="flex w-full flex-col gap-2 text-left">
              {TRACE_QUESTIONS.map((q) => (
                <li key={q} className="rounded-md border border-line bg-raised/80 px-4 py-3 text-sm text-bone">
                  {q}
                </li>
              ))}
            </ul>
            <label htmlFor="trace-notes" className="sr-only">
              Write what you're noticing (optional)
            </label>
            <Textarea
              id="trace-notes"
              rows={3}
              placeholder="Write what you're noticing… (optional, kept private)"
              className="mt-3"
            />
            <Button className="mt-5 w-full" size="lg" onClick={() => setView("fall-commit")}>
              Continue
            </Button>
            <BackTo onClick={() => setView("fall-truth")} />
          </>
        )}

        {view === "fall-commit" && (
          <>
            <Eyebrow tone="gold" className="mb-3">
              The return · 3 of 3
            </Eyebrow>
            <h1 className="font-display text-3xl font-bold tracking-tight text-bone">
              Return, not self-punishment.
            </h1>
            <p className="mb-6 mt-2 text-sm text-bone-2">
              Two commitments. They're the covenant you signed.
            </p>
            <div className="flex w-full flex-col gap-2 text-left">
              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-line bg-raised/80 px-4 py-3.5 text-sm text-bone">
                <Checkbox
                  checked={commitReach}
                  className="mt-0.5 h-5 w-5 border-gold"
                  onCheckedChange={(v) => setCommitReach(v === true)}
                />
                I will reach out to a brother - now, not after I feel better.
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-line bg-raised/80 px-4 py-3.5 text-sm text-bone">
                <Checkbox
                  checked={commitRhythms}
                  className="mt-0.5 h-5 w-5 border-gold"
                  onCheckedChange={(v) => setCommitRhythms(v === true)}
                />
                I will return to my normal rhythms, not self-punishment.
              </label>
            </div>
            <Button
              variant="outline"
              className="mt-5 w-full"
              disabled={!commitReach}
              onClick={() => setView("call")}
            >
              Call the brothers first
            </Button>
            <HoldButton
              className="mt-2.5"
              disabled={!commitReach || !commitRhythms || recordFall.isPending}
              onComplete={() => recordFall.mutate(undefined, { onSuccess: () => setView("fall-done") })}
            >
              Hold to return
            </HoldButton>
            <BackTo onClick={() => setView("fall-trace")} />
          </>
        )}

        {view === "fall-done" && (
          <>
            <ShieldCheck className="mb-4 h-10 w-10 text-gold" aria-hidden="true" />
            <Eyebrow tone="gold" className="mb-3">
              The return is made
            </Eyebrow>
            <h1 className="font-display text-3xl font-bold tracking-tight text-bone sm:text-4xl">
              Welcome back, brother.
            </h1>
            <p className="mx-auto mt-4 max-w-[360px] font-serif italic leading-relaxed text-bone-2">
              The fall is on the record, and so is the return. That's the Standard. Grace, not
              reset.
            </p>
            <Button className="mt-8 w-full" size="lg" onClick={() => navigate("/app")}>
              Back to Today
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default StandFirm;
