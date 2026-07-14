import { useEffect, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { FEATURES } from "@/features";
import { useForgeUser } from "@/hooks/useForgeProfile";
import { useVerseOfDay } from "@/hooks/useForgeVerses";
import { useBanner, useGroup, useSendStrength } from "@/hooks/useForgeGroup";
import { useForgeWeeks } from "@/hooks/useForgeCurriculum";
import { WEEKLY_CALL, isCallDay } from "@/data/weeklyCall";
import { Button } from "@/components/ui/button";
import { Eyebrow, InitialsAvatar, SectionCard } from "@/components/forge/atoms";
import { PageBackdrop } from "@/components/forge/scenes";
import { CheckInCard } from "@/components/today/CheckInCard";
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

const Today = () => {
  const { user } = useForgeUser();
  const { data: verse } = useVerseOfDay();
  const { data: group } = useGroup();
  const { data: banner } = useBanner();
  const { data: weeks } = useForgeWeeks();
  const sendStrength = useSendStrength();

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
            {/* 1. Daily Check-In: the primary card, in place of the old Standing hero */}
            <Reveal>
              <CheckInCard />
            </Reveal>

            {/* 2. Urges Redirected: the Hold-to-Redirect ritual */}
            <Reveal delay={0.06}>
              <UrgesRedirectedCard />
            </Reveal>

            {/* 3. Weekly Brotherhood Call: Tuesdays only (device-local, isCallDay) */}
            {isCallDay() && (
              <Reveal delay={0.09}>
                <div>
                  <Eyebrow className="mb-3 block text-center">Next brotherhood call</Eyebrow>
                  <SectionCard hatch className="p-4 text-center">
                    <p className="font-display text-lg font-bold tracking-tight text-bone">
                      {WEEKLY_CALL.label}
                    </p>
                    <p className="mt-0.5 text-xs text-gold">Tonight · all brothers welcome</p>
                    <Button
                      variant="outline"
                      className="mt-3 w-full"
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

            {/* The two KPIs (community + personal). No section title (client). */}
            <Reveal delay={0.12}>
              <div className="grid grid-cols-2 items-stretch gap-4">
                <ArmorActivatedCard />
                <LiberatedCard />
              </div>
            </Reveal>

            {/* Verse, then brothers/send-strength */}
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

            {FEATURES.groups && banner && (
              <Reveal delay={0.18}>
                <SectionCard className="p-5">
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
              </Reveal>
            )}
          </div>
      </div>
    </div>
  );
};

export default Today;
