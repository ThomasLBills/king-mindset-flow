import { useEvidenceCounter } from "@/hooks/useEvidenceCounter";

const FreedomStrip = () => {
  const { count, isLoading } = useEvidenceCounter();

  return (
    <div className="bg-[#0A0A0A] rounded-2xl border-[1.5px] border-[#C9A84C] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
      <h2 className="font-serif text-xl font-bold text-white text-center mb-2">Liberation</h2>
      <p className="text-sm text-white text-center mb-6">
        You are already free in Christ. This is the evidence.
      </p>
      <div className="flex justify-center mb-6">
        <div className="text-center">
          <p className="text-[56px] font-bold text-primary leading-none">{isLoading ? "–" : count}</p>
          <p className="text-lg text-[#FFFFFF] font-medium mt-4 tracking-[0.5px]">Pieces of New Evidence This Month</p>
        </div>
      </div>
    </div>
  );
};

export default FreedomStrip;
