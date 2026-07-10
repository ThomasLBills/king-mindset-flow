/**
 * "I Am Being Tempted". N.A.N.: Notice → Name → Navigate. Navigate ends in a
 * 2s Hold to Redirect that logs evidence "urge_redirected" (useUrgeCounter)
 * and returns to Today. The redesign's breathing pacer and "raise the banner"
 * prayer request are preserved as options inside Navigate, so nothing is lost.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Eyebrow, InitialsAvatar } from "@/components/forge/atoms";
import { HoldButton } from "@/components/forge/HoldButton";
import { useForgeUser } from "@/hooks/useForgeProfile";
import { useGroup, useRaiseBanner } from "@/hooks/useForgeGroup";
import { useUrgeCounter } from "@/hooks/useUrgeCounter";
import { useCrisisEventLogger } from "@/hooks/useTriggerPatterns";
import { celebrate } from "@/lib/celebrate";
import { BackTo, BreathingPacer } from "./frame";

const NOTICE = [
  { id: "pressure", label: "I feel pressure" },
  { id: "tired", label: "I'm tired" },
  { id: "relief", label: "I'm seeking relief" },
];

const TRUTHS = [
  "This urge does not define me. I am safe. This feeling will pass.",
  "I am a new creation in Christ. This urge does not control me.",
  "I am a son, not a slave. I don't need porn. I need to remember who I am.",
  "This feeling is temporary. My identity in Christ is permanent.",
  "I don't need relief from porn. I need to redirect this energy toward life.",
  "The urge is strong. The Spirit is stronger. I am not alone in this moment.",
];

const ACTIONS = [
  {
    id: "environment",
    title: "Change environments",
    helper: "Stand up. Walk outside. Physical movement interrupts the pattern. Get up now.",
  },
  {
    id: "slow",
    title: "Slow the body",
    helper: "Take three deep breaths. Slow breathing calms the nervous system. Breathe with me: In for 4. Hold for 4. Out for 6.",
  },
  {
    id: "engage",
    title: "Engage in action",
    helper: "Text a brother. Pray. Do 10 pushups. Connect with something real. Break isolation.",
  },
];

const PRAYER_TEMPLATES = [
  "Brothers, the pull is strong right now. Stand with me.",
  "In the fight this hour. Pray I hold the line.",
  "Tempted and tired. I'm not hiding it. Pray for me.",
];

type View = "notice" | "name" | "navigate" | "call" | "sent";

const optionRow = (selected: boolean) =>
  cn(
    "w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors",
    selected
      ? "border-gold-deep bg-raised-2 text-gold-bright"
      : "border-line bg-raised text-bone-2 hover:border-gold-deep/50"
  );

export const Tempted = ({ onBack }: { onBack: () => void }) => {
  const navigate = useNavigate();
  const { user } = useForgeUser();
  const { data: group } = useGroup();
  const raiseBanner = useRaiseBanner();
  const { addUrge } = useUrgeCounter();
  const { logCrisisEvent } = useCrisisEventLogger();

  // Preserve the forge trigger-pattern signal: entering the tempted flow logs
  // one crisis_button_events row (the same table the redesign already used).
  useEffect(() => {
    logCrisisEvent.mutate("tempted");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [view, setView] = useState<View>("notice");
  const [redirected, setRedirected] = useState(false);
  const [feeling, setFeeling] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [template, setTemplate] = useState(PRAYER_TEMPLATES[0]);

  const truth = useMemo(() => TRUTHS[Math.floor(Math.random() * TRUTHS.length)], []);
  const brothers = (group?.members ?? []).filter((m) => m.id !== user?.id);
  const allIds = brothers.map((b) => b.id);
  const effectiveSelected = selected.length ? selected : allIds;
  const activeAction = ACTIONS.find((a) => a.id === action);

  // Preserve the exact data write (evidence_events "urge_redirected"). On a
  // confirmed write, celebrate and hold a brief completion state before
  // returning to Today, so the redirect lands as earned progress.
  const steady = () => {
    addUrge.mutate(undefined, {
      onSuccess: () => {
        celebrate();
        setRedirected(true);
        setTimeout(() => navigate("/app"), 1600);
      },
    });
  };

  if (redirected) {
    return (
      <>
        <ShieldCheck className="mb-4 h-10 w-10 text-gold" aria-hidden="true" />
        <h1 className="font-display text-3xl font-bold tracking-tight text-bone">
          Urge redirected. New pathway built.
        </h1>
        <p className="mt-3 font-serif italic leading-relaxed text-bone-2">
          You didn't just resist. You practiced a different pathway. Every rep makes it stronger.
        </p>
      </>
    );
  }

  if (view === "notice") {
    return (
      <>
        <Eyebrow tone="gold" className="mb-1">
          Notice · Awareness without judgment
        </Eyebrow>
        <h1 className="font-display text-3xl font-bold tracking-tight text-bone">Notice</h1>
        <p className="mb-6 mt-2 text-[15px] leading-relaxed text-bone-2">
          The first step is awareness without judgment. Name what's happening. Naming creates
          distance. Distance reduces compulsion.
        </p>
        <div className="flex w-full flex-col gap-2.5">
          {NOTICE.map((n) => (
            <button
              key={n.id}
              onClick={() => setFeeling((f) => (f === n.id ? null : n.id))}
              className={optionRow(feeling === n.id)}
            >
              {n.label}
            </button>
          ))}
        </div>
        <Button className="mt-6 w-full" size="lg" disabled={!feeling} onClick={() => setView("name")}>
          Continue
        </Button>
        <BackTo onClick={onBack} label="Back to Your Armor" />
      </>
    );
  }

  if (view === "name") {
    return (
      <>
        <Eyebrow tone="gold" className="mb-1">
          Name the truth · Alignment with reality
        </Eyebrow>
        <h1 className="font-display text-3xl font-bold tracking-tight text-bone">Name The Truth</h1>
        <p className="mb-6 mt-2 text-[15px] leading-relaxed text-bone-2">
          Anchor to reality. Speak this truth out loud:
        </p>
        <p className="rounded-md border-l-2 border-gold-deep bg-raised/80 px-5 py-4 text-left font-serif text-xl italic leading-relaxed text-bone">
          {truth}
        </p>
        <p className="mt-4 text-sm text-bone-2">
          Truth interrupts the old loop. Speaking truth rewrites the belief underneath it.
        </p>
        <Button className="mt-7 w-full" size="lg" onClick={() => setView("navigate")}>
          Continue
        </Button>
        <BackTo onClick={() => setView("notice")} />
      </>
    );
  }

  if (view === "navigate") {
    return (
      <>
        <Eyebrow tone="gold" className="mb-1">
          Navigate · Choose the next aligned step
        </Eyebrow>
        <h1 className="font-display text-3xl font-bold tracking-tight text-bone">Navigate</h1>
        <p className="mb-6 mt-2 text-[15px] leading-relaxed text-bone-2">
          This is where you redirect. Choose one small, embodied response:
        </p>
        <div className="flex w-full flex-col gap-2.5">
          {ACTIONS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAction((cur) => (cur === a.id ? null : a.id))}
              className={optionRow(action === a.id)}
            >
              {a.title}
            </button>
          ))}
        </div>
        {activeAction && (
          <p className="mt-3 text-sm text-bone-2">{activeAction.helper}</p>
        )}
        {action === "slow" && <BreathingPacer />}

        <button
          onClick={() => setView("call")}
          className="mt-5 flex items-center gap-2 text-sm text-gold underline-offset-4 hover:underline"
        >
          <MessageSquare className="h-4 w-4" aria-hidden="true" /> Call the brothers instead
        </button>

        <p className="mt-4 text-sm text-bone-2">
          You're not trying to beat the urge. You're practicing a different pathway. Every time you
          practice, it gets stronger.
        </p>
        <HoldButton className="mt-5" disabled={!action || addUrge.isPending} onComplete={steady}>
          Hold to Redirect
        </HoldButton>
        <BackTo onClick={() => setView("name")} />
      </>
    );
  }

  if (view === "call") {
    return (
      <>
        <Eyebrow tone="gold" className="mb-3">
          Raise the banner
        </Eyebrow>
        <h1 className="font-display text-3xl font-bold tracking-tight text-bone">
          Your brothers want this call.
        </h1>
        <p className="mb-6 mt-2 text-sm text-bone-2">
          This logs the urge and sends a prayer request. You don't need to explain anything.
        </p>
        {brothers.length === 0 ? (
          <p className="rounded-md border border-line bg-raised/80 px-4 py-3 text-sm text-bone-2">
            No brothers connected yet. Add brothers from the Brotherhood page first.
          </p>
        ) : (
          <>
            <ul className="mb-4 flex w-full flex-col gap-1.5 text-left">
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
            <div className="flex w-full flex-col gap-1.5 text-left">
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
                    name="prayer-template"
                    className="sr-only"
                    checked={template === t}
                    onChange={() => setTemplate(t)}
                  />
                  “{t}”
                </label>
              ))}
            </div>
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
          </>
        )}
        <BackTo onClick={() => setView("navigate")} />
      </>
    );
  }

  // view === "sent"
  return (
    <>
      <Eyebrow tone="gold" className="mb-3">
        The banner is raised
      </Eyebrow>
      <h1 className="font-display text-3xl font-bold tracking-tight text-bone">
        They're being told right now.
      </h1>
      <p className="mb-2 mt-3 text-[15px] leading-relaxed text-bone-2">
        You did the strong thing. You didn't hide. Keep breathing. Answers usually come within
        minutes.
      </p>
      <BreathingPacer />
      <HoldButton className="mt-4" disabled={addUrge.isPending} onComplete={steady}>
        Hold when steady
      </HoldButton>
      <BackTo onClick={() => setView("navigate")} />
    </>
  );
};
