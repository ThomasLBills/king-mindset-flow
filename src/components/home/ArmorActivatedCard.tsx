import { Shield, TrendingUp, Users } from "lucide-react";
import { useCommunityArmor } from "@/hooks/useCommunityArmor";
import { Skeleton } from "@/components/ui/skeleton";

const ArmorActivatedCard = () => {
  const { data, isLoading } = useCommunityArmor();

  const thisWeek = data?.this_week_count ?? 0;
  const lastWeek = data?.last_week_count ?? 0;
  const engaged = data?.engaged_users ?? 0;
  const total = data?.total_users ?? 0;

  return (
    <div className="bg-[#0A0A0A] rounded-2xl border-[1.5px] border-[#C9A84C] p-5 text-white shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-primary" />
        </div>
        <h2 className="font-serif text-base font-bold text-white">
          Armor Activated This Week
        </h2>
      </div>
      <p className="text-xs text-white/50 mb-4 ml-[38px]">
        Kings walking in freedom together.
      </p>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-48 bg-white/10" />
          <Skeleton className="h-4 w-36 bg-white/10" />
          <Skeleton className="h-4 w-44 bg-white/10" />
        </div>
      ) : (
        <>
          {/* Main count */}
          <p className="text-2xl font-bold text-primary font-serif mb-2">
            {thisWeek.toLocaleString()}{" "}
            <span className="text-sm font-medium text-white/70">
              kingdom advances
            </span>
          </p>

          {/* Week-over-week */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-primary/70" />
            <p className="text-xs text-white/60">
              Up from {lastWeek.toLocaleString()} last week
            </p>
          </div>

          {/* Engaged users */}
          <div className="flex items-center gap-1.5">
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
