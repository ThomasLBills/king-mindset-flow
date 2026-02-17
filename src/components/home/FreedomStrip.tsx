import { useEvidenceCounter } from "@/hooks/useEvidenceCounter";

const FreedomStrip = () => {
  const { count, isLoading } = useEvidenceCounter();

  return (
    <div className="bg-[#111111] rounded-2xl border-l-4 border-primary p-5">
      {/* Card heading */}
      <h3 className="font-serif text-lg font-bold text-white text-center mb-3">Liberation</h3>

      {/* Grace message */}
      <p className="text-sm text-white leading-relaxed mb-6">You are already free in Christ. This is evidence you're walking in it. Every check-in, armor use, and declaration builds new neural pathways.

      </p>

      {/* Large evidence counter */}
      <div className="flex flex-col items-center py-6">
        <p className="text-6xl font-bold text-primary mb-6">
          {isLoading ? "–" : count}
        </p>
        <p className="text-base text-primary text-center mb-3">
          Pieces of New Evidence This Month
        </p>
        


      </div>
    </div>);

};

export default FreedomStrip;