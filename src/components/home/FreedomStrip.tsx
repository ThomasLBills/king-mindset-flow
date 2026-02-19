import { useEvidenceCounter } from "@/hooks/useEvidenceCounter";

const FreedomStrip = () => {
  const { count, isLoading } = useEvidenceCounter();

  return (
    <div className="bg-[#111111] rounded-2xl border-l-4 border-l-primary p-6">
      <h3 className="font-serif text-xl font-bold text-white text-center mb-2">Liberation</h3>
      <p className="text-sm text-white text-center mb-6">
        You are already free in Christ. This is evidence you're walking in it.
      </p>
      <div className="flex flex-col items-center">
        <p className="text-5xl font-bold text-primary mb-2">
          {isLoading ? "–" : count}
        </p>
        <p className="text-sm text-primary text-center">
          Pieces of New Evidence This Month
        </p>
      </div>
    </div>);

};

export default FreedomStrip;