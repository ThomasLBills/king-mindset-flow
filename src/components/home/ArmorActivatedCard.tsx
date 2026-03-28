import { useCommunityArmor } from "@/hooks/useCommunityArmor";
import { Skeleton } from "@/components/ui/skeleton";

const ArmorActivatedCard = () => {
  const { data, isLoading } = useCommunityArmor();

  const thisWeek = data?.this_week_count ?? 0;
  const allTime = data?.all_time_count ?? 0;

  return (
    <div className="bg-[#0A0A0A] rounded-2xl border-[1.5px] border-[#C9A84C] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
      {/* Thin gold accent line */}
      <div className="w-full h-px bg-[#C9A84C]/40 mb-5 -mt-1" />

      <h2 className="font-serif text-xl font-bold text-white text-center mb-2">
        Armor Activated
      </h2>
      <p className="text-sm text-white text-center mb-6">
        Kings walking in freedom together.
      </p>

      {isLoading ? (
        <div className="flex justify-center items-center gap-0">
          <div className="text-center flex-1">
            <Skeleton className="h-14 w-24 mx-auto bg-white/10" />
            <Skeleton className="h-5 w-20 mx-auto mt-4 bg-white/10" />
          </div>
          <div className="w-px h-16 bg-[#C9A84C]/20 flex-shrink-0" />
          <div className="text-center flex-1">
            <Skeleton className="h-14 w-24 mx-auto bg-white/10" />
            <Skeleton className="h-5 w-20 mx-auto mt-4 bg-white/10" />
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center gap-0 mb-6">
          <div className="text-center flex-1">
            <p className="text-[56px] font-bold text-primary leading-none">
              {thisWeek.toLocaleString()}
            </p>
            <p className="text-base text-[#FFFFFF] font-medium mt-4">This Week</p>
          </div>
          <div className="w-px h-16 bg-[#C9A84C]/20 flex-shrink-0" />
          <div className="text-center flex-1">
            <p className="text-[56px] font-bold text-primary leading-none">
              {allTime.toLocaleString()}
            </p>
            <p className="text-base text-[#FFFFFF] font-medium mt-4">All Time</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArmorActivatedCard;
