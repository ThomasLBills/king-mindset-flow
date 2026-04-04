import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUrgeCounter } from "@/hooks/useUrgeCounter";
import { Button } from "@/components/ui/button";

const sansFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

const UrgesRedirectedCard = () => {
  const { dailyCount, lifetimeCount, addUrge } = useUrgeCounter();
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleAdd = () => {
    addUrge.mutate(undefined, {
      onSuccess: () => {
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 1000);
      },
    });
  };

  return (
    <div className="relative bg-[#1A1A1A] rounded-[16px] p-5 overflow-hidden" style={{ fontFamily: sansFont }}>
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-[#1A1A1A] rounded-[16px]"
          >
            <p className="text-lg font-semibold text-white text-center" style={{ fontFamily: sansFont }}>
              Urge redirected. New pathway built.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-primary text-left mb-2">
        Urges Redirected
      </h2>
      <p className="text-left mb-6" style={{ fontSize: "14px", fontWeight: 400, color: "rgba(255,255,255,0.65)" }}>
        Every time you redirect an urge, you build a new pathway. Log it here.
      </p>

      <div className="flex justify-center items-center gap-0 mb-6">
        <div className="text-center flex-1">
          <p className="text-[56px] leading-none" style={{ fontWeight: 300, color: "rgba(255,255,255,0.9)" }}>{dailyCount}</p>
          <p className="mt-4 uppercase" style={{ fontSize: "11px", letterSpacing: "0.06em", color: "rgba(255,255,255,0.4)" }}>Today</p>
        </div>
        <div className="flex-shrink-0" style={{ width: "1px", height: "40px", background: "rgba(255,255,255,0.1)" }} />
        <div className="text-center flex-1">
          <p className="text-[56px] leading-none text-primary" style={{ fontWeight: 600 }}>{lifetimeCount}</p>
          <p className="mt-4 uppercase" style={{ fontSize: "11px", letterSpacing: "0.06em", color: "rgba(255,255,255,0.4)" }}>Lifetime</p>
        </div>
      </div>

      <Button
        onClick={handleAdd}
        disabled={addUrge.isPending}
        className="w-full rounded-[10px] font-semibold h-[50px] text-[20px] bg-primary text-[#1A1A1A] hover:bg-primary/90 border-0"
        style={{ padding: "13px 0" }}
      >
        +1
      </Button>
    </div>
  );
};

export default UrgesRedirectedCard;
