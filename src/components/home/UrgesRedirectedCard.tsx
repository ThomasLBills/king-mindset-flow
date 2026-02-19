import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUrgeCounter } from "@/hooks/useUrgeCounter";
import { Button } from "@/components/ui/button";

const UrgesRedirectedCard = () => {
  const { dailyCount, monthlyCount, addUrge } = useUrgeCounter();
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
    <div className="relative bg-[#0A0A0A] rounded-2xl border-l border-l-[#C9A84C] p-6 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.15)]">
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-[#0A0A0A] rounded-2xl"
          >
            <p className="font-serif text-lg font-bold text-white text-center">
              Urge redirected. New pathway built.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <h2 className="font-serif text-xl font-bold text-white text-center mb-2">
        Urges Redirected
      </h2>
      <p className="text-sm text-white text-center mb-6">
        Every time you redirect an urge, you build a new pathway. Log it here.
      </p>

      <div className="flex justify-center gap-8 mb-6">
        <div className="text-center">
          <p className="text-5xl font-bold text-primary">{dailyCount}</p>
          <p className="text-base text-white font-medium mt-2">Today</p>
        </div>
        <div className="text-center">
          <p className="text-5xl font-bold text-primary">{monthlyCount}</p>
          <p className="text-base text-white font-medium mt-2">This Month</p>
        </div>
      </div>

      <Button
        onClick={handleAdd}
        disabled={addUrge.isPending}
        className="w-full rounded-xl font-bold h-12 text-base bg-primary text-[#0A0A0A] hover:bg-primary/90"
      >
        +1
      </Button>
    </div>
  );
};

export default UrgesRedirectedCard;
