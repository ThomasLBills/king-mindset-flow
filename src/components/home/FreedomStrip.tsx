import { useEvidenceCounter } from "@/hooks/useEvidenceCounter";

const FreedomStrip = () => {
  const { count, isLoading } = useEvidenceCounter();

  return (
    <div className="bg-[#111111] rounded-2xl border-l-4 border-l-primary p-6">
      <h2 className="font-serif text-xl font-bold text-white text-center mb-2">Liberation</h2>
      <p className="text-sm text-white text-center mb-6">
        You are already free in Christ. This is the evidence.
      </p>
      <div className="flex justify-center gap-8 mb-6">
        <div className="text-center">
          <p className="text-sm text-white font-medium mb-1">This Month</p>
          <p className="text-4xl font-bold text-primary">{isLoading ? "–" : count}</p>
        </div>
      </div>
    </div>);

};

export default FreedomStrip;