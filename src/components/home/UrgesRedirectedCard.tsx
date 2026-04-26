import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUrgeCounter } from "@/hooks/useUrgeCounter";
import { Check } from "lucide-react";

const sansFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";
const HOLD_DURATION = 2000;

const UrgesRedirectedCard = () => {
  const { dailyCount, lifetimeCount, addUrge } = useUrgeCounter();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [holding, setHolding] = useState(false);
  const [completed, setCompleted] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startHold = useCallback(() => {
    if (addUrge.isPending || completed) return;
    setHolding(true);
    timeoutRef.current = setTimeout(() => {
      setHolding(false);
      setCompleted(true);
      if (navigator.vibrate) navigator.vibrate(50);
      addUrge.mutate(undefined, {
        onSuccess: () => {
          setShowConfirmation(true);
          setTimeout(() => setShowConfirmation(false), 1000);
        },
      });
      setTimeout(() => setCompleted(false), 1500);
    }, HOLD_DURATION);
  }, [addUrge, completed]);

  const cancelHold = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setHolding(false);
  }, []);

  return (
    <div className="relative dark-card-gradient rounded-[16px] p-5 overflow-hidden" style={{ fontFamily: sansFont }}>
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center dark-card-gradient rounded-[16px]"
          >
            <p className="text-lg font-semibold text-white text-center" style={{ fontFamily: sansFont }}>
              Urge redirected. New pathway built.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <h2 className="uppercase text-center mb-2" style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.12em", color: "#B8963F" }}>
        Urges Redirected
      </h2>
      <p className="text-center mb-6" style={{ fontSize: "14px", fontWeight: 400, color: "#F5F3EE" }}>
        Every redirect builds a new pathway.
      </p>


      <div className="flex justify-center items-center gap-0 mb-6">
        <div className="text-center flex-1">
          <p className="leading-none tabular-nums" style={{ fontSize: "44px", fontWeight: 400, color: "#F5F3EE", letterSpacing: "-0.02em" }}>{dailyCount}</p>
          <p className="mt-4 uppercase" style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.12em", color: "rgba(245, 243, 238, 0.5)" }}>Today</p>
        </div>
        <div className="flex-shrink-0 self-center" style={{ width: "1px", height: "26px", background: "rgba(245, 243, 238, 0.08)" }} />
        <div className="text-center flex-1">
          <p className="leading-none tabular-nums" style={{ fontSize: "44px", fontWeight: 550, color: "#A6842F", letterSpacing: "-0.02em" }}>{lifetimeCount}</p>
          <p className="mt-4 uppercase" style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.12em", color: "rgba(245, 243, 238, 0.5)" }}>Lifetime</p>
        </div>
      </div>

      <button
        onMouseDown={startHold}
        onMouseUp={cancelHold}
        onMouseLeave={cancelHold}
        onTouchStart={startHold}
        onTouchEnd={cancelHold}
        onTouchCancel={cancelHold}
        disabled={addUrge.isPending}
        className="relative w-full rounded-[10px] overflow-hidden border-0 select-none"
        style={{ padding: "13px 0", background: completed ? "#B8963F" : "#F5F3EE", cursor: "pointer" }}
      >
        {/* Gold fill bar */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            borderRadius: "10px",
            background: "#B8963F",
            width: holding ? "100%" : "0%",
            transition: holding ? `width ${HOLD_DURATION}ms linear` : "none",
          }}
        />
        {/* Button text */}
        <span
          className="relative z-10 flex items-center justify-center gap-1.5"
          style={{ fontSize: "14px", fontWeight: 600, color: "#1A1A1A", fontFamily: sansFont }}
        >
          {completed ? (
            <>
              <Check size={16} strokeWidth={2.5} />
              Redirected
            </>
          ) : (
            "Hold to Redirect"
          )}
        </span>
      </button>
    </div>
  );
};

export default UrgesRedirectedCard;
