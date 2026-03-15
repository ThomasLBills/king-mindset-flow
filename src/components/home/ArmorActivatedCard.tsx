import { TrendingUp, Users } from "lucide-react";
import { useCommunityArmor } from "@/hooks/useCommunityArmor";
import { Skeleton } from "@/components/ui/skeleton";

const ArmorActivatedCard = () => {
  const { data, isLoading } = useCommunityArmor();

  const thisWeek = data?.this_week_count ?? 0;
  const lastWeek = data?.last_week_count ?? 0;
  const engaged = data?.engaged_users ?? 0;
  const total = data?.total_users ?? 0;

  return (
    <div className="bg-[#0A0A0A] rounded-2xl border-[1.5px] border-[#C9A84C] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
      {/* Thin gold accent line */}
      <div className="w-full h-px bg-[#C9A84C]/40 mb-5 -mt-1" />

      <h2 className="font-serif text-xl font-bold text-white text-center mb-2">
        Armor Activated This Week
      </h2>
      <p className="text-sm text-white text-center mb-6">
        Kings walking in freedom together.
      </p>

      {isLoading ? (
        <div className="flex flex-col items-center space-y-3">
          <Skeleton className="h-14 w-24 bg-white/10" />
          <Skeleton className="h-5 w-40 bg-white/10" />
          <Skeleton className="h-4 w-36 bg-white/10" />
          <Skeleton className="h-4 w-44 bg-white/10" />
        </div>
      ) : (
        <>
          {/* Main count */}
          <div className="flex justify-center mb-6">
            <div className="text-center">
              <p className="text-[56px] font-bold text-primary leading-none">
                {thisWeek.toLocaleString()}
              </p>
              <p className="text-[20px] text-[#FFFFFF] font-medium mt-4 tracking-[0.5px]">
                Kingdom Advances
              </p>
            </div>
          </div>

          {/* Week-over-week */}
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-primary/70" />
            <p className="text-xs text-white/60">
              Up from {lastWeek.toLocaleString()} last week
            </p>
          </div>

          {/* Engaged users */}
          <div className="flex items-center justify-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-primary/70" />
            <p className="text-xs text-white/60">
              {engaged} of {total} kings engaged
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default ArmorActivatedCard;
