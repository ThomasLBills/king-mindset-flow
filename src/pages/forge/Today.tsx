import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FEATURES } from "@/features";
import { useForgeUser } from "@/hooks/useForgeProfile";
import { useStandard, type StandardCycle } from "@/hooks/useStandard";
import { usePathToday, type PathStep } from "@/hooks/usePathToday";
import { useSideVerse, useVerseOfDay } from "@/hooks/useForgeVerses";
import { useBanner, useGroup, useSendStrength, type ForgeBrother } from "@/hooks/useForgeGroup";
import { useWeekStats } from "@/hooks/useWeekStats";
import { useForgeWeeks } from "@/hooks/useForgeCurriculum";
import { WEEKLY_CALL, isCallDay } from "@/data/weeklyCall";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Eyebrow, InitialsAvatar, SectionCard } from "@/components/forge/atoms";
import { Grain, SceneShafts } from "@/components/forge/scenes";
import { CheckInDialog, ReflectionDialog } from "@/components/today/dialogs";

const timeOfDay = () => {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
};

// Entrance animation plays once per session; replaying it on every route
// return makes an already-loaded page feel like it is loading again.
let revealPlayed = false;

const Reveal = ({ children, delay = 0 }: { children: ReactNode; delay?: number }) => {
  const reduce = useReducedMotion();
  const skip = reduce || revealPlayed;
  return (
    <motion.div
      initial={skip ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

const FELL_WORDS = ["None", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

const TheStandard = ({ cycle }: { cycle: StandardCycle }) => {
  const held = cycle.days.filter((d) => d === "held").length;
  const fell = cycle.days.length - held;
  const pct = Math.round((held / cycle.days.length) * 100);
  return (
    <SectionCard hatch className="p-5 sm:p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <Eyebrow>The Standard · this cycle</Eyebrow>
        <Eyebrow>Day {cycle.day}</Eyebrow>
      </div>
      <div className="mb-4 flex items-end gap-4">
        <div className="font-display text-[56px] font-bold leading-[0.82] tracking-tight text-bone">
          {held}
          <span className="text-xl font-semibold text-dim">/{cycle.days.length}</span>
        </div>
        <div className="pb-1">
          <div className="font-display text-xs uppercase tracking-[0.1em] text-gold">
            Days held · {pct}%
          </div>
          {FEATURES.longestRun && (
            <div className="text-[13px] text-bone-2">Your longest run yet was {cycle.longestRun} days.</div>
          )}
        </div>
      </div>
      <div className="mb-3 flex flex-wrap items-end gap-1 py-1" aria-hidden="true">
        {cycle.days.map((outcome, i) => (
          <span
            key={i}
            className={cn(
              "w-[5px] rounded-[1px]",
              outcome === "held"
                ? "h-7 bg-gold shadow-[0_0_7px_-1px_hsl(var(--primary)/0.4)]"
                : "h-3.5 bg-ember opacity-90",
              i === cycle.day - 1 && "outline outline-1 outline-offset-2 outline-gold-bright"
            )}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-bone-2">
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-2 w-2 rounded-[2px] bg-gold" aria-hidden="true" /> Held
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-2 w-2 rounded-[2px] bg-ember" aria-hidden="true" /> Fell
        </span>
        <span className="font-serif italic text-dim">
          {fell > 0
            ? `${FELL_WORDS[fell] ?? fell} fell, and each one is still on the record. Grace, not reset.`
            : "A clean cycle so far. Stay watchful, stay humble."}
        </span>
      </div>
    </SectionCard>
  );
};

const StepMarker = ({ status }: { status: PathStep["status"] }) => (
  <span
    aria-hidden="true"
    className={cn(
      "grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border text-xs",
      status === "done" && "border-gold-deep bg-[hsl(38_45%_9%)] text-gold",
      status === "now" && "border-gold text-gold",
      status === "locked" && "border-line text-dim"
    )}
  >
    {status === "done" ? (
      <Check className="h-3 w-3" />
    ) : status === "now" ? (
      "●"
    ) : (
      <Lock className="h-2.5 w-2.5" />
    )}
  </span>
);

const PathToday = ({
  steps,
  onCheckIn,
  onReflect,
}: {
  steps: PathStep[];
  onCheckIn: () => void;
  onReflect: () => void;
}) => (
  <SectionCard className="p-5">
    <Eyebrow className="mb-2 block">Your path today</Eyebrow>
    <div>
      {steps.map((step, i) => (
        <div
          key={step.id}
          className={cn(
            "flex items-center gap-3 py-3",
            i > 0 && "border-t border-line-soft",
            step.status === "locked" && "opacity-60"
          )}
        >
          <StepMarker status={step.status} />
          <div className="min-w-0 flex-1">
            <span
              className={cn(
                "block text-sm font-semibold",
                step.status === "done" ? "text-bone-2 line-through decoration-dim" : "text-bone"
              )}
            >
              {step.title}
            </span>
            <span className="text-xs text-dim">{step.sub}</span>
          </div>
          {step.status === "now" &&
            (step.kind === "reading" && step.to ? (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-gold-deep font-display text-[10.5px] uppercase tracking-[0.12em] text-gold hover:text-gold-bright"
              >
                <Link to={step.to}>Continue</Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="border-gold-deep font-display text-[10.5px] uppercase tracking-[0.12em] text-gold hover:text-gold-bright"
                onClick={step.kind === "checkin" ? onCheckIn : onReflect}
              >
                {step.kind === "checkin" ? "Begin" : "Reflect"}
              </Button>
            ))}
        </div>
      ))}
    </div>
    <Link
      to="/app/rhythms"
      className="mt-1 inline-block text-xs text-dim underline-offset-4 transition-colors hover:text-gold hover:underline"
    >
      All daily rhythms →
    </Link>
  </SectionCard>
);

const statusDot: Record<ForgeBrother["status"], { className: string; label: string }> = {
  steady: { className: "bg-gold", label: "steady" },
  struggling: { className: "bg-ember", label: "in the fight" },
  away: { className: "bg-line", label: "away" },
};

const Today = () => {
  const { user } = useForgeUser();
  const { data: standard } = useStandard();
  const { data: path } = usePathToday();
  const { data: verse } = useVerseOfDay();
  const { data: sideVerse } = useSideVerse();
  const { data: group } = useGroup();
  const { data: banner } = useBanner();
  const { data: stats } = useWeekStats();
  const { data: weeks } = useForgeWeeks();
  const sendStrength = useSendStrength();
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [reflectOpen, setReflectOpen] = useState(false);

  useEffect(() => {
    revealPlayed = true;
  }, []);

  // Workbook (week 0) is prep material, not part of the numbered journey.
  const journeyWeeks = weeks?.filter((w) => !w.isWorkbook);
  const currentWeek =
    journeyWeeks?.find((w) => !w.locked && w.lessons.some((l) => !l.done)) ?? journeyWeeks?.[0];
  const totalWeeks = journeyWeeks?.length ?? 0;

  return (
    <div className="relative">
      <div className="ember-bg pointer-events-none absolute inset-0" aria-hidden="true" />
      <Grain />
      {/* Hero photo bleeds down behind the first cards, feathered out by a mask */}
      <SceneShafts className="h-[440px] opacity-90 [mask-image:linear-gradient(to_bottom,black_25%,transparent_100%)] lg:h-[500px]" />
      <div className="relative flex flex-col xl:flex-row">
        <div className="min-w-0 flex-1">
          {/* Greeting hero */}
          <div className="relative px-5 pb-6 pt-8 sm:px-8 lg:pt-10">
            <div className="relative mx-auto max-w-[760px]">
              {currentWeek && (
                <p className="mb-1.5">
                  <Eyebrow>Week {currentWeek.number} of {totalWeeks}</Eyebrow>{" "}
                  <span className="ml-1 font-serif text-base italic text-gold-bright">
                    {currentWeek.title}
                  </span>
                </p>
              )}
              <h1 className="font-display text-3xl font-bold tracking-tight text-bone lg:text-4xl">
                Good {timeOfDay()}, {user?.firstName ?? "brother"}.
              </h1>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-[760px] flex-col gap-4 px-5 pb-10 sm:px-8">
            {!standard || !path ? (
              <>
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-40 w-full" />
              </>
            ) : (
              <>
                {FEATURES.theStandard && (
                  <Reveal>
                    <TheStandard cycle={standard} />
                  </Reveal>
                )}
                <Reveal delay={0.06}>
                  <PathToday
                    steps={path}
                    onCheckIn={() => setCheckInOpen(true)}
                    onReflect={() => setReflectOpen(true)}
                  />
                </Reveal>
                {verse && (
                  <Reveal delay={0.12}>
                    <SectionCard className="bg-gradient-to-br from-raised to-[hsl(35_23%_8%)] p-6">
                      <Eyebrow tone="gold">{verse.ref}</Eyebrow>
                      <p className="mt-2 font-serif text-xl italic leading-relaxed text-bone">
                        “{verse.text}”
                      </p>
                    </SectionCard>
                  </Reveal>
                )}
                <Reveal delay={0.18}>
                  <div className="flex flex-col gap-4 sm:flex-row">
                    {FEATURES.groups && banner && (
                      <SectionCard className="flex-1 p-5">
                        <Eyebrow className="mb-3 block">{group?.name ?? "Your brothers"}</Eyebrow>
                        <div className="mb-3 flex items-center gap-2.5">
                          <InitialsAvatar initials={banner.initials} />
                          <span className="text-sm font-semibold text-bone">
                            {banner.name}
                            <span className="block font-serif text-xs font-normal italic text-ember">
                              Raised the banner · {banner.when}
                            </span>
                          </span>
                        </div>
                        {banner.strengthened ? (
                          <p className="flex items-center gap-2 text-sm text-gold">
                            <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Strength sent. He knows
                            you're with him.
                          </p>
                        ) : (
                          <Button
                            className="w-full"
                            disabled={sendStrength.isPending}
                            onClick={() =>
                              sendStrength.mutate(banner, {
                                onSuccess: () =>
                                  toast.success(`${banner.name} will see you standing with him.`),
                              })
                            }
                          >
                            {sendStrength.isPending ? "Sending…" : "Send strength"}
                          </Button>
                        )}
                      </SectionCard>
                    )}
                    {stats && (
                      <SectionCard className="flex-1 p-5">
                        <Eyebrow className="mb-1 block">This week</Eyebrow>
                        <dl>
                          <div className="flex items-baseline justify-between py-2 text-sm text-bone-2">
                            <dt>Urges redirected</dt>
                            <dd className="font-display text-lg font-bold text-bone">
                              {stats.urgesRedirected}
                            </dd>
                          </div>
                          {FEATURES.extraStats && (
                            <>
                              <div className="flex items-baseline justify-between border-t border-line-soft py-2 text-sm text-bone-2">
                                <dt>Readings finished</dt>
                                <dd className="font-display text-lg font-bold text-bone">
                                  {stats.readingsFinished}
                                </dd>
                              </div>
                              <div className="flex items-baseline justify-between border-t border-line-soft py-2 text-sm text-bone-2">
                                <dt>Brothers reached</dt>
                                <dd className="font-display text-lg font-bold text-bone">
                                  {stats.brothersReached}
                                </dd>
                              </div>
                            </>
                          )}
                        </dl>
                      </SectionCard>
                    )}
                  </div>
                </Reveal>
              </>
            )}
          </div>
        </div>

        {/* Side rail: desktop column, stacked cards on smaller screens */}
        <aside className="flex w-full flex-col gap-6 border-t border-line bg-forge-2 px-5 py-7 sm:px-8 xl:sticky xl:top-0 xl:h-dvh xl:w-[300px] xl:shrink-0 xl:self-start xl:overflow-y-auto xl:border-l xl:border-t-0 xl:px-5">
          <div>
            <h2 className="mb-3">
              <Eyebrow>Next brotherhood call</Eyebrow>
            </h2>
            <SectionCard hatch className="p-4">
              <p className="font-display text-lg font-bold tracking-tight text-bone">
                {WEEKLY_CALL.label}
              </p>
              <p className="mt-0.5 text-xs text-gold">Every week · all brothers welcome</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={() =>
                  isCallDay()
                    ? window.open(WEEKLY_CALL.joinUrl, "_blank", "noopener,noreferrer")
                    : toast.info(`The room opens ${WEEKLY_CALL.label}.`)
                }
              >
                Join the call
              </Button>
            </SectionCard>
          </div>
          {FEATURES.groups && group && (
            <div>
              <h2 className="mb-3">
                <Eyebrow>{group.name}</Eyebrow>
              </h2>
              <ul className="flex flex-col gap-2.5">
                {group.members.map((m) => (
                  <li key={m.id} className="flex items-center gap-2.5 text-[13.5px] text-bone-2">
                    <InitialsAvatar initials={m.initials} tone="raised" className="h-[30px] w-[30px]" />
                    {m.name}
                    {FEATURES.statusDots && (
                      <span
                        className={cn("ml-auto h-2 w-2 rounded-full", statusDot[m.status].className)}
                        title={statusDot[m.status].label}
                      >
                        <span className="sr-only">{statusDot[m.status].label}</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {sideVerse && (
            <div>
              <h2 className="mb-3">
                <Eyebrow>A word for the fight</Eyebrow>
              </h2>
              <p className="font-serif text-[15px] italic leading-relaxed text-bone-2">
                “{sideVerse.text}”
                <span className="mt-2 block font-display text-[11px] not-italic tracking-[0.14em] text-gold">
                  {sideVerse.ref.toUpperCase()}
                </span>
              </p>
            </div>
          )}
        </aside>
      </div>

      <CheckInDialog open={checkInOpen} onOpenChange={setCheckInOpen} />
      <ReflectionDialog open={reflectOpen} onOpenChange={setReflectOpen} />
    </div>
  );
};

export default Today;
