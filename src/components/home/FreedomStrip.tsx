import { useEvidenceCounter } from "@/hooks/useEvidenceCounter";
import { Skeleton } from "@/components/ui/skeleton";

const sansFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

const FreedomStrip = () => {
  const { thisWeekCount, isLoading } = useEvidenceCounter();

  return (
    <div
      className="dark-card-gradient rounded-[16px] h-full flex flex-col justify-between"
      style={{ fontFamily: sansFont, padding: "20px 18px" }}
    >
      <p className="type-eyebrow" style={{ color: "rgba(245, 243, 238, 0.5)" }}>
        Liberated
      </p>

      {isLoading ? (
        <div className="flex flex-col gap-2 my-4">
          <Skeleton className="h-12 w-20 bg-white/10" />
          <Skeleton className="h-3 w-24 bg-white/10" />
        </div>
      ) : (
        <>
          <p className="type-display my-3" style={{ color: "#B8963F" }}>
            {thisWeekCount.toLocaleString()}
          </p>
          <p className="type-meta" style={{ color: "rgba(245, 243, 238, 0.55)" }}>
            {thisWeekCount === 1
              ? "Moment of evidence this week."
              : "Moments of evidence this week."}
          </p>
        </>
      )}
    </div>
  );
};

export default FreedomStrip;
