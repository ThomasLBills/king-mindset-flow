/**
 * Home KPI + ritual cards in the Forge visual language:
 *  - ArmorActivatedCard: community-wide "Armor Activated / All Kings"
 *    (get_community_armor_stats RPC), This week + Lifetime.
 *  - LiberatedCard: personal "Liberated / My Evidence" (all of the user's
 *    evidence_events, no event_type filter), This week + Lifetime.
 *  - UrgesRedirectedCard: the "Hold to Redirect" ritual, a 2s press-and-hold
 *    that logs one evidence_events row (event_type "urge_redirected") and shows
 *    an inline success flash. Never navigates. Shows Today + Lifetime counts.
 *
 * The two KPIs read two DIFFERENT scopes (community vs personal) and must not
 * be conflated. All three reuse intact hooks (useCommunityArmor /
 * useEvidenceCounter / useUrgeCounter).
 */
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCommunityArmor } from "@/hooks/useCommunityArmor";
import { useEvidenceCounter } from "@/hooks/useEvidenceCounter";
import { useUrgeCounter } from "@/hooks/useUrgeCounter";
import { Eyebrow, SectionCard } from "@/components/forge/atoms";
import { HoldButton } from "@/components/forge/HoldButton";
import { Skeleton } from "@/components/ui/skeleton";
import { celebrate } from "@/lib/celebrate";

/** The 2s hold constant, matching the original `fj` / HOLD_DURATION. */
const HOLD_MS = 2000;

/** Shared "This week / Lifetime" KPI card body. */
const KpiCard = ({
  title,
  subtitle,
  week,
  lifetime,
  loading,
}: {
  title: string;
  subtitle: string;
  week: number;
  lifetime: number;
  loading: boolean;
}) => (
  <SectionCard className="flex-1 p-5">
    <Eyebrow tone="gold" className="block text-center">
      {title}
    </Eyebrow>
    <p className="mb-3 mt-0.5 text-center text-xs text-bone-2">{subtitle}</p>
    {loading ? (
      <div className="flex flex-col items-center gap-2 py-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    ) : (
      <div className="flex flex-col items-center">
        <p className="font-display text-3xl font-bold leading-none tabular-nums text-bone">
          {week.toLocaleString()}
        </p>
        <Eyebrow className="mt-1.5">This week</Eyebrow>
        <div className="my-2.5 h-px w-full bg-line-soft" aria-hidden="true" />
        <p className="font-display text-xl font-bold leading-none tabular-nums text-gold">
          {lifetime.toLocaleString()}
        </p>
        <Eyebrow className="mt-1.5">Lifetime</Eyebrow>
      </div>
    )}
  </SectionCard>
);

/** Community-wide "Armor Activated / All Kings". */
export const ArmorActivatedCard = () => {
  const { data, isLoading } = useCommunityArmor();
  return (
    <KpiCard
      title="Armor Activated"
      subtitle="All Kings"
      week={data?.this_week_count ?? 0}
      lifetime={data?.all_time_count ?? 0}
      loading={isLoading}
    />
  );
};

/** Personal "Liberated / My Evidence": counts all of the user's evidence. */
export const LiberatedCard = () => {
  const { count, thisWeekCount, isLoading } = useEvidenceCounter();
  return (
    <KpiCard
      title="Liberated"
      subtitle="My Evidence"
      week={thisWeekCount}
      lifetime={count}
      loading={isLoading}
    />
  );
};

/** "Urges redirected": the Hold to Redirect ritual (no navigation). */
export const UrgesRedirectedCard = () => {
  const { dailyCount, lifetimeCount, addUrge } = useUrgeCounter();
  const [flash, setFlash] = useState(false);

  return (
    <SectionCard hatch className="relative p-5 text-center">
      {flash && (
        <div className="absolute inset-0 z-10 grid place-items-center rounded-lg bg-raised/95">
          <p className="flex items-center gap-2 font-serif text-lg italic text-gold">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            Urge redirected. New pathway built.
          </p>
        </div>
      )}
      <Eyebrow tone="gold" className="block">
        Urges redirected
      </Eyebrow>
      <p className="mt-1 text-sm text-bone-2">Every redirect builds a new pathway.</p>

      <div className="my-5 flex items-stretch justify-center gap-8">
        <div>
          <p className="font-display text-4xl font-bold leading-none tabular-nums text-bone">
            {dailyCount}
          </p>
          <Eyebrow className="mt-2">Today</Eyebrow>
        </div>
        <div className="w-px bg-line-soft" aria-hidden="true" />
        <div>
          <p className="font-display text-4xl font-bold leading-none tabular-nums text-gold">
            {lifetimeCount}
          </p>
          <Eyebrow className="mt-2">Lifetime</Eyebrow>
        </div>
      </div>

      <HoldButton
        duration={HOLD_MS}
        disabled={addUrge.isPending}
        onComplete={() => {
          if (navigator.vibrate) navigator.vibrate(50);
          addUrge.mutate(undefined, {
            onSuccess: () => {
              celebrate();
              setFlash(true);
              setTimeout(() => setFlash(false), 1200);
            },
          });
        }}
        // White at rest; the hold sweeps gold across it, and it stays fully gold
        // through the success flash.
        className={cn("bg-bone text-forge", addUrge.isPending && "opacity-70")}
        fillClassName="bg-gold"
        completed={flash}
      >
        Hold to Redirect
      </HoldButton>
    </SectionCard>
  );
};
