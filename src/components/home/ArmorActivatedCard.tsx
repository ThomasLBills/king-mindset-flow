import { useCommunityArmor } from "@/hooks/useCommunityArmor";
import { Skeleton } from "@/components/ui/skeleton";

const sansFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

const ArmorActivatedCard = () => {
  const { data, isLoading } = useCommunityArmor();

  const thisWeek = data?.this_week_count ?? 0;
  const allTime = data?.all_time_count ?? 0;

  return (
    <div className="bg-[#1A1A1A] rounded-[16px] p-[18px] h-full flex flex-col" style={{ fontFamily: sansFont }}>
      <h2 className="uppercase text-center mb-0.5" style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.12em", color: "#B8963F" }}>
        Armor Activated
      </h2>
      <p className="text-center mb-[14px]" style={{ fontSize: "12px", fontWeight: 400, color: "#F5F3EE" }}>
        All Kings this week
      </p>

      {isLoading ? (
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-8 w-16 bg-white/10" />
          <Skeleton className="h-3 w-12 bg-white/10" />
        </div>
      ) : (
        <div className="flex flex-col items-center flex-1 justify-center">
          <p className="leading-none tabular-nums" style={{ fontSize: "32px", fontWeight: 400, color: "#F5F3EE", letterSpacing: "-0.01em" }}>
            {thisWeek.toLocaleString()}
          </p>
          <p className="mt-1 uppercase" style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.12em", color: "rgba(245, 243, 238, 0.5)" }}>
            This week
          </p>

          <div className="w-full my-[10px]" style={{ height: "1px", background: "rgba(245, 243, 238, 0.06)" }} />

          <p className="leading-none tabular-nums" style={{ fontSize: "22px", fontWeight: 500, color: "#A6842F", letterSpacing: "-0.01em" }}>
            {allTime.toLocaleString()}
          </p>
          <p className="mt-1 uppercase" style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.12em", color: "rgba(245, 243, 238, 0.5)" }}>
            Lifetime
          </p>
        </div>
      )}
    </div>
  );
};

export default ArmorActivatedCard;
