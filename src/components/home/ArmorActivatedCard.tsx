import { useCommunityArmor } from "@/hooks/useCommunityArmor";
import { Skeleton } from "@/components/ui/skeleton";

const sansFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

const ArmorActivatedCard = () => {
  const { data, isLoading } = useCommunityArmor();

  const thisWeek = data?.this_week_count ?? 0;

  return (
    <div
      className="dark-card-gradient rounded-[16px] h-full flex flex-col justify-between"
      style={{ fontFamily: sansFont, padding: "20px 18px" }}
    >
      <p className="type-eyebrow" style={{ color: "rgba(245, 243, 238, 0.5)" }}>
        Armor Activated
      </p>

      {isLoading ? (
        <div className="flex flex-col gap-2 my-4">
          <Skeleton className="h-12 w-20 bg-white/10" />
          <Skeleton className="h-3 w-24 bg-white/10" />
        </div>
      ) : (
        <>
          <p
            className="type-display my-3"
            style={{ color: "#B8963F" }}
          >
            {thisWeek.toLocaleString()}
          </p>
          <p className="type-meta" style={{ color: "rgba(245, 243, 238, 0.55)" }}>
            Brothers stood firm this week.
          </p>
        </>
      )}
    </div>
  );
};

export default ArmorActivatedCard;
