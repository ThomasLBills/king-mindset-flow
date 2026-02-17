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

      {/* Neural pathways message */}
      <p className="text-sm text-white leading-relaxed mb-6">
        Every check-in, armor use, and declaration builds new neural pathways.
      </p>

      {/* Large evidence counter */}
      <div className="flex flex-col items-center py-6">
        <p className="text-6xl font-bold text-primary mb-6">
          {isLoading ? "–" : count}
        </p>
        <p className="text-base text-primary text-center mb-3">
          Pieces of New Evidence This Month
        </p>
        <p className="text-sm text-white text-center">
          You are already free in Christ. This is evidence you're walking in it.
        </p>
      </div>
    </div>
  );
};

export default FreedomStrip;
