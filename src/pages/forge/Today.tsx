import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Lock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { FEATURES } from "@/features";
import { useForgeUser } from "@/hooks/useForgeProfile";
import { usePathToday, type PathStep } from "@/hooks/usePathToday";
import { useVerseOfDay } from "@/hooks/useForgeVerses";
import { useBanner, useGroup, useSendStrength } from "@/hooks/useForgeGroup";
import { useWeekStats } from "@/hooks/useWeekStats";
import { useForgeWeeks } from "@/hooks/useForgeCurriculum";
import { WEEKLY_CALL, isCallDay } from "@/data/weeklyCall";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Eyebrow, InitialsAvatar, SectionCard } from "@/components/forge/atoms";
import { PageBackdrop } from "@/components/forge/scenes";
import { CheckInCard } from "@/components/today/CheckInCard";
import { CheckInDialog, ReflectionDialog } from "@/components/today/dialogs";
import { ArmorActivatedCard, LiberatedCard, UrgesRedirectedCard } from "@/components/today/stats";

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

const Today = () => {
  const { user } = useForgeUser();
  const { data: path } = usePathToday();
  const { data: verse } = useVerseOfDay();
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
      {/* Darkening scrim now lives in the shared PageBackdrop (applies to every
          backdrop screen), so Today no longer needs its own. */}
      <PageBackdrop />
      <div className="relative">
        {/* Greeting hero */}
          <div className="relative mx-auto max-w-3xl px-5 pb-6 pt-8 sm:px-8 lg:pt-10">
            <div className="relative">
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

          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-5 pb-10 sm:px-8">
            {/* 1. Daily Check-In — the primary card, in place of the old Standing hero */}
            <Reveal>
              <CheckInCard />
            </Reveal>

            {/* 2. Urges Redirected — the Hold-to-Redirect ritual */}
            <Reveal delay={0.06}>
              <UrgesRedirectedCard />
            </Reveal>

            {/* 3. Weekly Brotherhood Call — Tuesdays only (device-local, isCallDay) */}
            {isCallDay() && (
              <Reveal delay={0.09}>
                <div>
                  <Eyebrow className="mb-3 block">Next brotherhood call</Eyebrow>
                  <SectionCard hatch className="p-4">
                    <p className="font-display text-lg font-bold tracking-tight text-bone">
                      {WEEKLY_CALL.label}
                    </p>
                    <p className="mt-0.5 text-xs text-gold">Tonight · all brothers welcome</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() =>
                        window.open(WEEKLY_CALL.joinUrl, "_blank", "noopener,noreferrer")
                      }
                    >
                      Join the call
                    </Button>
                  </SectionCard>
                </div>
              </Reveal>
            )}

            {/* 4. This week's evidence — the two KPIs (community + personal) */}
            <Reveal delay={0.12}>
              <div>
                <Eyebrow className="mb-3 block">This week's evidence</Eyebrow>
                <div className="grid grid-cols-2 items-stretch gap-4">
                  <ArmorActivatedCard />
                  <LiberatedCard />
                </div>
              </div>
            </Reveal>

            {/* 5. The rest — verse, brothers/send-strength + weekly stats, then the path */}
            {verse && (
              <Reveal delay={0.15}>
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
                        // Success confirms in place: the card flips to the
                        // "Strength sent" state once forge-banner refetches, so
                        // no toast (P4). Failure surfaces via the global net.
                        onClick={() => sendStrength.mutate(banner)}
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
                        <dt>Urges you turned from</dt>
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

            {!path ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <Reveal delay={0.21}>
                <PathToday
                  steps={path}
                  onCheckIn={() => setCheckInOpen(true)}
                  onReflect={() => setReflectOpen(true)}
                />
              </Reveal>
            )}
          </div>
      </div>

      <CheckInDialog open={checkInOpen} onOpenChange={setCheckInOpen} />
      <ReflectionDialog open={reflectOpen} onOpenChange={setReflectOpen} />
    </div>
  );
};

export default Today;
