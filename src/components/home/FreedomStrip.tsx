import { useEvidenceCounter } from "@/hooks/useEvidenceCounter";

const FreedomStrip = () => {
  const { count, isLoading } = useEvidenceCounter();

  return (
    <div className="bg-[#0A0A0A] rounded-2xl border-l border-l-[#C9A84C] p-6">
      <h2 className="font-serif text-xl font-bold text-white text-center mb-2">Liberation</h2>
      <p className="text-sm text-white text-center mb-6">
        You are already free in Christ. This is the evidence.
      </p>
      <div className="flex justify-center mb-6">
        <div className="text-center">
          <p className="text-5xl font-bold text-primary">{isLoading ? "–" : count}</p>
          <p className="text-base text-white font-medium mt-2">Pieces of New Evidence This Month</p>
        </div>
      </div>
    </div>
  );
};

export default FreedomStrip;
