import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FEATURES } from "@/features";
import { useForgeUser, useCompleteOnboarding } from "@/hooks/useForgeProfile";
import { useSetWhy, useSealCovenant } from "@/hooks/useCovenant";
import { useGroup } from "@/hooks/useForgeGroup";
import { WEEKLY_CALL } from "@/data/weeklyCall";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Eyebrow, FoilRule, InitialsAvatar } from "@/components/forge/atoms";
import { LkMonogram, LkSeal } from "@/components/forge/brand";
import { Grain, SceneRidge } from "@/components/forge/scenes";

const VOWS = [
  "I will not fight alone.",
  "I will tell the truth, especially the truth I want to hide.",
  "When I fall, I will return quickly, without hiding.",
  "I will turn to Christ first, not last.",
  "I will guard the people entrusted to me.",
  "I will show up on the ordinary days, not only the hard ones.",
];

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

const ASSESSMENT = [
  {
    key: "duration",
    question: "How long has this been a fight?",
    options: ["Years, most of my life", "A few years", "Months", "It's recent"],
  },
  {
    key: "frequency",
    question: "How often does it win right now?",
    options: ["Most days", "A few times a week", "A few times a month", "Rarely, but it's still there"],
  },
  {
    key: "hardest",
    question: "When is it hardest?",
    options: ["Late at night", "Under stress", "When I'm alone", "Traveling / away from home"],
  },
] as const;

const Ticks = ({ total, done }: { total: number; done: number }) => (
  <div className="mb-6 flex justify-center gap-1.5" aria-label={`Step ${done} of ${total}`}>
    {Array.from({ length: total }, (_, i) => (
      <i key={i} className={cn("h-0.5 w-6 rounded-full", i < done ? "bg-gold" : "bg-line")} aria-hidden="true" />
    ))}
  </div>
);

const whySchema = z.object({
  why: z
    .string()
    .min(3, "One honest sentence. It will fight for you later.")
    .max(140, "Keep it short enough to remember under fire"),
});

const CovenantStep = ({
  onSealed,
  pending,
}: {
  onSealed: (signedName: string) => void;
  pending: boolean;
}) => {
  const [signature, setSignature] = useState("");
  const today = useMemo(() => format(new Date(), "d MMMM yyyy"), []);
  const ready = signature.trim().length >= 2;

  return (
    <div className="relative mx-auto w-full max-w-[600px] px-6 pb-24">
      <LkSeal className="pointer-events-none absolute left-1/2 top-10 h-[380px] w-[380px] -translate-x-1/2 text-gold opacity-5" />
      <div className="relative">
        <LkMonogram className="mx-auto mb-4 h-9 w-12 text-gold" />
        <p className="mb-2.5 text-center font-display text-[10px] font-bold uppercase tracking-[0.28em] text-gold">
          Sworn this day
        </p>
        <h1 className="text-center font-serif text-5xl font-semibold text-bone sm:text-[54px]">
          The Covenant
        </h1>
        <FoilRule className="mx-auto mb-6 mt-4" />
        <p className="mx-auto mb-9 max-w-[44ch] text-center font-serif text-[17px] italic leading-relaxed text-bone-2">
          This is not a promise to an app. It is a vow before God, and your brothers will help you
          keep it.
        </p>
        <ol className="mx-auto mb-8 flex max-w-[460px] flex-col gap-4">
          {VOWS.map((vow, i) => (
            <li key={i} className="flex items-baseline gap-4">
              <span
                className="w-7 shrink-0 font-display text-xs font-bold tracking-wide text-gold"
                aria-hidden="true"
              >
                {ROMAN[i]}
              </span>
              <p className="font-serif text-[21px] leading-snug text-bone">{vow}</p>
            </li>
          ))}
        </ol>
        <p className="mx-auto mb-9 max-w-[48ch] text-center font-serif italic leading-relaxed text-bone-2">
          I make this covenant not by my own strength, but in the strength of the One who first kept
          covenant with me.
        </p>

        <div className="relative overflow-hidden rounded-lg border border-gold-deep bg-gradient-to-b from-[hsl(35_23%_9%)] to-[hsl(35_25%_7%)] px-6 pb-5 pt-6">
          <div className="flex items-end gap-6">
            <div className="min-w-0 flex-1">
              <div className="border-b border-gold-deep pb-1.5">
                <label htmlFor="covenant-signature" className="sr-only">
                  Type your full name to sign
                </label>
                <Input
                  id="covenant-signature"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Type your name"
                  autoComplete="off"
                  className="h-11 rounded-none border-0 bg-transparent px-0 font-script text-3xl text-gold-bright placeholder:font-sans placeholder:text-sm placeholder:text-dim focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <p className="mt-2 font-display text-[9.5px] font-semibold uppercase tracking-[0.2em] text-dim">
                Signature
              </p>
            </div>
            <div className="w-[140px] shrink-0">
              <div className="flex min-h-[44px] items-end border-b border-gold-deep pb-1.5">
                <span className="font-serif text-lg text-bone">{today}</span>
              </div>
              <p className="mt-2 font-display text-[9.5px] font-semibold uppercase tracking-[0.2em] text-dim">
                Date
              </p>
            </div>
          </div>
        </div>

        <Button
          size="lg"
          className="mx-auto mt-7 block w-full max-w-[340px]"
          disabled={!ready || pending}
          onClick={() => onSealed(signature.trim())}
        >
          {pending ? "Sealing…" : "Seal the covenant"}
        </Button>
      </div>
    </div>
  );
};

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useForgeUser();
  const setWhy = useSetWhy();
  const sealCovenant = useSealCovenant();
  const completeOnboarding = useCompleteOnboarding();
  const { data: group } = useGroup();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const whyForm = useForm<z.infer<typeof whySchema>>({
    resolver: zodResolver(whySchema),
    defaultValues: { why: "" },
  });

  // welcome · assessment · why · group · covenant (flag)
  const totalSteps = FEATURES.covenant ? 5 : 4;

  const finish = async (signedName?: string) => {
    // Covenant is a new table whose migration may not be live yet; never let
    // its failure block a member from finishing onboarding.
    if (signedName) {
      sealCovenant.mutate(signedName, {
        onError: (err) => console.warn("Covenant not saved (non-blocking):", err),
      });
    }
    try {
      await completeOnboarding.mutateAsync();
    } catch {
      toast.error("Couldn't finish onboarding. Check your connection and try again.");
      return;
    }
    toast.success(signedName ? "The covenant is sealed. Welcome, king." : "Welcome, brother.");
    navigate("/app", { replace: true });
  };

  const assessmentComplete = ASSESSMENT.every((q) => answers[q.key]);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-forge">
      <div className="ember-bg pointer-events-none absolute inset-0" aria-hidden="true" />
      {step === totalSteps - 1 && FEATURES.covenant && (
        <SceneRidge className="h-[480px] opacity-40 [mask-image:linear-gradient(to_bottom,black_20%,transparent_100%)]" />
      )}
      <Grain />

      <div
        className={cn(
          "relative py-10",
          // Covenant is a long scrolling document; every other step is short
          // and belongs vertically centered on the canvas, not floating at the top.
          !(FEATURES.covenant && step === totalSteps - 1) &&
            "flex min-h-[100dvh] flex-col justify-center"
        )}
      >
        <Ticks total={totalSteps} done={step + 1} />

        {step === 0 && (
          <div className="mx-auto flex max-w-md flex-col items-center px-6 pt-8 text-center">
            <LkMonogram className="mb-6 h-10 w-14 text-gold" />
            <Eyebrow tone="gold" className="mb-3">
              Liberated Kings
            </Eyebrow>
            <h1 className="font-display text-4xl font-bold uppercase tracking-wide text-bone">
              You're in the right place.
            </h1>
            <p className="mt-4 font-serif text-lg italic leading-relaxed text-bone-2">
              Thousands of men fight this fight. Almost all of them fight it alone. For you, that
              ends tonight.
            </p>
            <p className="mt-3 text-sm text-bone-2">
              Three minutes of honest questions, then you meet your brothers.
            </p>
            <Button size="lg" className="mt-8 w-full" onClick={() => setStep(1)}>
              Begin
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="mx-auto max-w-md px-6">
            <h1 className="mb-6 text-center font-display text-2xl font-bold uppercase tracking-wide text-bone">
              Tell it straight
            </h1>
            <div className="flex flex-col gap-6">
              {ASSESSMENT.map((q) => (
                <fieldset key={q.key}>
                  <legend className="mb-2 text-sm font-semibold text-bone">{q.question}</legend>
                  <div className="flex flex-col gap-1.5">
                    {q.options.map((opt) => (
                      <label
                        key={opt}
                        className={cn(
                          "cursor-pointer rounded-md border px-3.5 py-2.5 text-sm transition-colors",
                          answers[q.key] === opt
                            ? "border-gold-deep bg-raised-2 text-gold-bright"
                            : "border-line bg-raised text-bone-2 hover:border-gold-deep/50"
                        )}
                      >
                        <input
                          type="radio"
                          name={q.key}
                          className="sr-only"
                          checked={answers[q.key] === opt}
                          onChange={() => setAnswers((a) => ({ ...a, [q.key]: opt }))}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
            <p className="mt-5 text-center font-serif text-sm italic text-dim">
              No score and no judgment. You're a man in a common fight, not an exception.
            </p>
            <Button size="lg" className="mt-5 w-full" disabled={!assessmentComplete} onClick={() => setStep(2)}>
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="mx-auto max-w-md px-6">
            <h1 className="text-center font-display text-2xl font-bold uppercase tracking-wide text-bone">
              Why freedom?
            </h1>
            <p className="mt-3 text-center text-sm leading-relaxed text-bone-2">
              One sentence. On the hardest night, we'll hand it back to you.
            </p>
            <Form {...whyForm}>
              <form
                onSubmit={whyForm.handleSubmit(({ why }) => {
                  // Fire-and-forget: the why lives in the new covenant table,
                  // and saving it must never block the next step.
                  setWhy.mutate(why.trim(), {
                    onError: (err) => console.warn("Why not saved (non-blocking):", err),
                  });
                  setStep(3);
                })}
                className="mt-6 space-y-5"
              >
                <FormField
                  control={whyForm.control}
                  name="why"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder={'e.g. "To be present for Elise." or "To look my sons in the eye."'}
                          className="font-serif text-lg italic placeholder:font-sans placeholder:text-sm placeholder:not-italic"
                          {...field}
                        />
                      </FormControl>
                      {/* Fixed slot so the error doesn't shift the button under the cursor */}
                      <div className="min-h-[20px]">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                <Button type="submit" size="lg" className="w-full">
                  That's my why
                </Button>
              </form>
            </Form>
          </div>
        )}

        {step === 3 && (
          <div className="mx-auto max-w-md px-6 text-center">
            <Eyebrow tone="gold" className="mb-3 block">
              Your brothers
            </Eyebrow>
            <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
              {FEATURES.groups && group ? group.name : "The brotherhood"}
            </h1>
            <p className="mt-3 font-serif italic leading-relaxed text-bone-2">
              Five men who will know your name, notice your absence, and answer when you raise the
              banner.
            </p>
            {FEATURES.groups && group && (
              <ul className="mx-auto mt-6 flex max-w-[300px] flex-col gap-3">
                {group.members.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 rounded-md border border-line bg-raised px-4 py-2.5 text-left">
                    <InitialsAvatar initials={m.initials} tone="raised" />
                    <span className="text-sm font-semibold text-bone">{m.name}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-5 text-xs text-dim">
              Weekly call: {WEEKLY_CALL.label}. Be there, {user?.firstName ?? "brother"}.
              They'll be expecting you.
            </p>
            {FEATURES.covenant ? (
              <Button size="lg" className="mt-7 w-full" onClick={() => setStep(4)}>
                One last thing: the Covenant
              </Button>
            ) : (
              <Button
                size="lg"
                className="mt-7 w-full"
                disabled={completeOnboarding.isPending}
                onClick={() => finish()}
              >
                {completeOnboarding.isPending ? "Entering…" : "Enter the brotherhood"}
              </Button>
            )}
          </div>
        )}

        {step === 4 && FEATURES.covenant && (
          <CovenantStep onSealed={(name) => finish(name)} pending={completeOnboarding.isPending} />
        )}

        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="mx-auto mt-8 block text-center text-[13px] text-dim transition-colors hover:text-bone-2"
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
