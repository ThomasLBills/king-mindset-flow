/**
 * "I Need to Return": the R.E.T.U.R.N. post-fall protocol. Exact 6-step
 * order and copy from the original tool: Recognize, Engage, Trace, Uproot,
 * Resume, Navigate. Trace's note is optional; Uproot and Resume are each
 * gated by a mandatory checkbox. The final "Hold to Return" fires the three
 * original writes together (useReturn): relapse_events + freedom_streaks
 * reset + evidence "grace_protocol_complete", then returns to Today.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Eyebrow } from "@/components/forge/atoms";
import { HoldButton } from "@/components/forge/HoldButton";
import { useConfirm } from "@/components/feedback";
import { BackTo } from "./frame";
import { useReturn } from "@/hooks/useStandard";
import { useCrisisEventLogger } from "@/hooks/useTriggerPatterns";
import { celebrateBig } from "@/lib/celebrate";

const TITLES = [
  "Recognize The Truth",
  "Engage The Father",
  "Trace What Happened",
  "Uproot Isolation",
  "Resume Normal Rhythms",
  "Navigate Forward",
];

const SUBTITLES = [
  "Anchor to what is real",
  "Come as a son, not a slave",
  "Data, not condemnation",
  "Break the power of secrecy",
  "Return, not self-punishment",
  "Failure is feedback",
];

const STEP1_DECLARATIONS = [
  "The verdict is still settled. Romans 8:1 is still true. I am still fully accepted. This failure does not define me.",
  "I am still His son. This moment doesn't change my identity. The Father still sees me through Christ, not through this failure.",
  "Grace is not permission to sin. Grace is permission to return. I am returning now as a son, not as a slave.",
  "My access to the Father is through Christ's blood, not my performance. I am coming home, not earning my way back.",
  "This failure does not disqualify me. Jesus paid for this moment on the cross. I am still covered. I am still His.",
  "Shame says I'm done. Grace says I can return. I choose grace. I am returning now.",
  "I am not my worst moment. I am who God says I am. His son. Forgiven. Accepted. Loved.",
  "The enemy wants me to spiral. God invites me to return. I refuse shame. I receive grace. I am returning now.",
  "My identity is not up for debate. I am sealed by the Holy Spirit. This failure cannot change what Christ has done.",
  "I fell. I am not staying down. Romans 8:1 is still true. There is no condemnation. I am returning as a son.",
];

const STEP2_PRAYERS = [
  "Father, I fell. I'm not hiding. I'm here. Thank You that this doesn't change my standing. Thank You that I'm still Your son. I receive Your grace right now. Help me learn from this.",
  "Father, I'm coming to You as a son, not a slave. I failed, and I'm not staying in the shame. Thank You that Romans 8:1 is still true. Help me see what led to this.",
  "God, I don't deserve Your grace. That's exactly the point. Thank You that my access to You is through Christ, not through my performance. I'm here. I'm listening. Help me return.",
  "Father, I'm not hiding from You. I'm running to You. Thank You that You don't receive me based on what I've done. You receive me because of what Christ has done. I receive that now.",
  "God, I'm here. Not because I earned it. Because You invited me. Thank You that Your grace is bigger than my failure. I receive it. Help me walk forward.",
  "Father, I failed. I'm not making excuses. I'm also not staying in the shame. Thank You that my standing is secure in Christ. Help me learn what led to this.",
  "God, I come to You as Your son. I fell, and I'm not pretending I didn't. Thank You that You don't turn me away. Thank You that grace is real. I receive it now.",
  "Father, shame is loud right now. Your voice is louder. Thank You that I'm still Yours. Thank You that this moment doesn't define me. Help me see clearly.",
  "God, I'm not spiraling. I'm returning. Thank You that Your arms are open. Thank You that Your grace is sufficient. I receive it. Help me walk in freedom.",
  "Father, I don't deserve to be here. That's the gospel. None of us do. Thank You that Christ made a way. I'm here because of Him, not because of me. I receive Your grace.",
];

const TRACE_QUESTIONS = [
  "What pressure was I under?",
  "What was I actually seeking? Relief? Escape? Comfort?",
  "When did I drift from Spirit-dependence?",
  "What was the first moment I could have chosen differently?",
];

const RESUME_ITEMS = [
  "Go to bed at your normal time",
  "Wake up tomorrow as a son, not a failure",
  "Continue your daily practices without shame-driven intensity",
];

const NAVIGATE_ITEMS = [
  "What pattern am I noticing?",
  "What trigger did I miss?",
  "What new practice or boundary might help?",
  "What do I need to bring to my next group call?",
];

const StepHeader = ({ step }: { step: number }) => (
  <>
    <Eyebrow tone="gold" className="mb-1">
      The return · {step + 1} of 6
    </Eyebrow>
    <h1 className="font-display text-3xl font-bold tracking-tight text-bone">{TITLES[step]}</h1>
    <p className="mb-5 mt-1 font-serif text-sm italic text-gold">{SUBTITLES[step]}</p>
  </>
);

const Quote = ({ children }: { children: string }) => (
  <p className="rounded-md border-l-2 border-gold-deep bg-raised/80 px-4 py-3 text-left font-serif italic leading-relaxed text-bone">
    {children}
  </p>
);

const Bullets = ({ items }: { items: string[] }) => (
  <ul className="flex w-full flex-col gap-2 text-left">
    {items.map((q) => (
      <li key={q} className="rounded-md border border-line bg-raised/80 px-4 py-3 text-sm text-bone">
        {q}
      </li>
    ))}
  </ul>
);

const Teaching = ({ plain, gold }: { plain: string; gold: string }) => (
  <p className="mt-4 text-sm text-bone-2">
    {plain} <span className="text-gold">{gold}</span>
  </p>
);

export const ReturnFlow = ({ onBack }: { onBack: () => void }) => {
  const navigate = useNavigate();
  const ret = useReturn();
  const confirm = useConfirm();
  const { logCrisisEvent } = useCrisisEventLogger();

  // Same trigger-pattern signal the forge triage logged for "already fell".
  useEffect(() => {
    logCrisisEvent.mutate("already fell");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [step, setStep] = useState(0);
  const [notes, setNotes] = useState("");
  const [commitReach, setCommitReach] = useState(false);
  const [commitRhythms, setCommitRhythms] = useState(false);
  const [done, setDone] = useState(false);

  const declaration = useMemo(
    () => STEP1_DECLARATIONS[Math.floor(Math.random() * STEP1_DECLARATIONS.length)],
    []
  );
  const prayer = useMemo(
    () => STEP2_PRAYERS[Math.floor(Math.random() * STEP2_PRAYERS.length)],
    []
  );

  const back = () => (step > 0 ? setStep((s) => s - 1) : onBack());

  // Resetting the freedom streak is irreversible, so confirm before the three
  // writes fire (P5). Failure of the writes surfaces via the global net.
  const completeReturn = async () => {
    const ok = await confirm({
      title: "Log the fall and restart your streak?",
      consequence:
        "This records the fall and resets your freedom streak to today. Your return is on the record too. This can't be undone.",
      confirmLabel: "Complete the return",
      cancelLabel: "Not yet",
      destructive: true,
    });
    if (!ok) return;
    ret.mutate(undefined, {
      onSuccess: () => {
        // The heaviest milestone: honor the return with the big burst.
        celebrateBig();
        setDone(true);
        setTimeout(() => navigate("/app"), 1500);
      },
    });
  };

  if (done) {
    return (
      <>
        <ShieldCheck className="mb-4 h-10 w-10 text-gold" aria-hidden="true" />
        <h1 className="font-display text-3xl font-bold tracking-tight text-bone">
          You returned. You are still His.
        </h1>
        <p className="mt-3 font-serif italic leading-relaxed text-bone-2">
          The fall is on the record, and so is the return. Grace, not reset.
        </p>
      </>
    );
  }

  return (
    <>
      <StepHeader step={step} />

      {step === 0 && (
        <>
          <p className="text-[15px] leading-relaxed text-bone-2">
            Don't open another tab. Close everything. Stand up. Walk away from the screen.
          </p>
          <p className="mb-2 mt-4 text-sm text-gold">Speak this out loud:</p>
          <Quote>{declaration}</Quote>
          <Teaching
            plain="You're not suppressing the guilt."
            gold="You're anchoring to truth before the spiral takes over."
          />
          <Button className="mt-7 w-full" size="lg" onClick={() => setStep(1)}>
            Continue
          </Button>
        </>
      )}

      {step === 1 && (
        <>
          <p className="text-[15px] leading-relaxed text-bone-2">
            Don't hide. Don't delay. Go to God immediately as a son, not a slave.
          </p>
          <p className="mb-2 mt-4 text-sm text-gold">Pray this out loud:</p>
          <Quote>{prayer}</Quote>
          <Teaching plain="Short. Honest." gold="No performing." />
          <Button className="mt-7 w-full" size="lg" onClick={() => setStep(2)}>
            Continue
          </Button>
        </>
      )}

      {step === 2 && (
        <>
          <p className="text-[15px] leading-relaxed text-bone-2">
            Shame says: "You're disgusting. You'll never change." Grace asks: "What actually
            happened? What led to this?"
          </p>
          <p className="mb-3 mt-4 text-sm text-gold">Ask yourself:</p>
          <Bullets items={TRACE_QUESTIONS} />
          <Textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Write what you're noticing:"
            className="mt-3"
          />
          <Teaching plain="Don't judge. Just observe." gold="This is data, not condemnation." />
          <Button className="mt-5 w-full" size="lg" onClick={() => setStep(3)}>
            Continue
          </Button>
        </>
      )}

      {step === 3 && (
        <>
          <p className="text-[15px] leading-relaxed text-bone-2">
            Don't isolate. Shame grows in secrecy.
          </p>
          <p className="mb-2 mt-4 text-sm text-gold">Text someone in your brotherhood:</p>
          <Quote>I fell tonight. Not spiraling, just being honest. I'm still in the fight.</Quote>
          <Teaching plain="You don't need a long conversation." gold="You need to break isolation." />
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-md border border-line bg-raised/80 px-4 py-3.5 text-left text-sm text-bone">
            <Checkbox
              checked={commitReach}
              className="mt-0.5 h-5 w-5 border-gold"
              onCheckedChange={(v) => setCommitReach(v === true)}
            />
            I commit to reach out to a brother
          </label>
          <Button
            className="mt-5 w-full"
            size="lg"
            disabled={!commitReach}
            onClick={() => setStep(4)}
          >
            Continue
          </Button>
        </>
      )}

      {step === 4 && (
        <>
          <p className="text-[15px] leading-relaxed text-bone-2">
            Don't punish yourself. Don't try to earn back your standing through extra disciplines.
          </p>
          <p className="mb-3 mt-4 text-sm text-gold">Return to normal:</p>
          <Bullets items={RESUME_ITEMS} />
          <Teaching plain="The goal is return," gold="not self-punishment." />
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-md border border-line bg-raised/80 px-4 py-3.5 text-left text-sm text-bone">
            <Checkbox
              checked={commitRhythms}
              className="mt-0.5 h-5 w-5 border-gold"
              onCheckedChange={(v) => setCommitRhythms(v === true)}
            />
            I commit to return to normal rhythms, not self-punishment
          </label>
          <Button
            className="mt-5 w-full"
            size="lg"
            disabled={!commitRhythms}
            onClick={() => setStep(5)}
          >
            Continue
          </Button>
        </>
      )}

      {step === 5 && (
        <>
          <p className="text-[15px] leading-relaxed text-bone-2">
            After the shame has settled, reflect:
          </p>
          <div className="mt-3">
            <Bullets items={NAVIGATE_ITEMS} />
          </div>
          <Teaching plain="Failure is feedback." gold="Use it." />
          <HoldButton className="mt-6" disabled={ret.isPending} onComplete={completeReturn}>
            {ret.isPending ? "Returning…" : "Hold to Return"}
          </HoldButton>
        </>
      )}

      <BackTo onClick={back} />
    </>
  );
};
