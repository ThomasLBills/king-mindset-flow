import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUrgeCounter } from "@/hooks/useUrgeCounter";
import { Button } from "@/components/ui/button";

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
    <div className="relative bg-[#0A0A0A] rounded-2xl border-[1.5px] border-[#C9A84C] p-6 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
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

      <div className="flex justify-center items-center gap-0 mb-6">
        <div className="text-center flex-1">
          <p className="text-[56px] font-bold text-primary leading-none">{dailyCount}</p>
          <p className="text-base text-[#FFFFFF] font-medium mt-4">Today</p>
        </div>
        <div className="w-px h-16 bg-[#C9A84C]/20 flex-shrink-0" />
        <div className="text-center flex-1">
          <p className="text-[56px] font-bold text-primary leading-none">{lifetimeCount}</p>
          <p className="text-base text-[#FFFFFF] font-medium mt-4">Lifetime</p>
        </div>
      </div>

      <Button
        onClick={handleAdd}
        disabled={addUrge.isPending}
        className="w-full rounded-xl font-bold h-12 text-[20px] bg-primary text-[#1A1A1A] hover:bg-primary/90"
      >
        +1
      </Button>
    </div>
  );
};

export default UrgesRedirectedCard;
