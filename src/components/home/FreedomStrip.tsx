import { Shield } from "lucide-react";
import { useEvidenceCounter } from "@/hooks/useEvidenceCounter";

const FreedomStrip = () => {
  const { count, isLoading } = useEvidenceCounter();

  return (
    <div className="bg-[#111111] rounded-2xl border-l-4 border-primary p-5">
      {/* Card heading */}
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-5 w-5 text-primary flex-shrink-0" />
        <h3 className="font-serif text-lg font-bold text-white">Liberation</h3>
      </div>

      {/* Grace message */}
      <p className="text-sm text-white leading-relaxed mb-6">
        You are loved today. Not because of your streak, but because of the cross.
      </p>

      {/* Large evidence counter */}
      <div className="flex flex-col items-center py-6">
        <p className="text-6xl font-bold text-white mb-6">
          {isLoading ? "–" : count}
        </p>
        <p className="text-base text-white text-center mb-3">
          Pieces of New Evidence This Month
        </p>
        <p className="text-sm text-white/50 text-center">
          Every check-in, armor use, and declaration builds new neural pathways.
        </p>
      </div>
    </div>
  );
};

export default FreedomStrip;
