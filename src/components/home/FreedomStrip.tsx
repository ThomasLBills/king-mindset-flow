import { useEvidenceCounter } from "@/hooks/useEvidenceCounter";
import { Skeleton } from "@/components/ui/skeleton";

const sansFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

const FreedomStrip = () => {
  const { count, thisWeekCount, isLoading } = useEvidenceCounter();

  return (
    <div className="bg-[#1A1A1A] rounded-[16px] p-[18px] h-full flex flex-col" style={{ fontFamily: sansFont }}>
      <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-primary text-left mb-0.5">
        Liberated
      </h2>
      <p className="text-left mb-[14px]" style={{ fontSize: "12px", fontWeight: 400, color: "#F5F3EE" }}>
        Evidence of freedom
      </p>

      {isLoading ? (
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-8 w-16 bg-white/10" />
          <Skeleton className="h-3 w-12 bg-white/10" />
        </div>
      ) : (
        <div className="flex flex-col items-center flex-1 justify-center">
          <p className="text-[28px] leading-none text-white" style={{ fontWeight: 600 }}>
            {thisWeekCount.toLocaleString()}
          </p>
          <p className="mt-1 uppercase" style={{ fontSize: "11px", letterSpacing: "0.06em", color: "rgba(255,255,255,0.5)" }}>
            This week
          </p>

          <div className="w-full my-[10px]" style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />

          <p className="text-[22px] leading-none text-primary" style={{ fontWeight: 300 }}>
            {count.toLocaleString()}
          </p>
          <p className="mt-1 uppercase" style={{ fontSize: "11px", letterSpacing: "0.06em", color: "rgba(255,255,255,0.5)" }}>
            Lifetime
          </p>
        </div>
      )}
    </div>
  );
};

export default FreedomStrip;
