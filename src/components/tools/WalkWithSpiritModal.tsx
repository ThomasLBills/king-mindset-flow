import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEvidenceCounter } from "@/hooks/useEvidenceCounter";

const sansFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";
const serifFont = "'Cormorant Garamond', 'Times New Roman', Georgia, serif";

interface Props {
  onClose: () => void;
}

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p
    style={{
      fontFamily: serifFont,
      fontSize: "13px",
      letterSpacing: "0.25em",
      color: "hsl(var(--primary))",
      textTransform: "uppercase",
      fontWeight: 500,
      textAlign: "center",
      marginBottom: "28px",
    }}
  >
    {children}
  </p>
);

const SurrenderStep = ({ onComplete }: { onComplete: () => void }) => {
  const [visibleLines, setVisibleLines] = useState(0);
  const [holding, setHolding] = useState(false);
  const [completed, setCompleted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lines = [
    "Holy Spirit, I need You today.",
    "Lead me. Empower me.",
    "I'm not doing this alone.",
  ];

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    lines.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleLines((v) => Math.max(v, i + 1)), 400 * (i + 1)));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  const startHold = useCallback(() => {
    if (completed) return;
    setHolding(true);
    timerRef.current = setTimeout(() => {
      setHolding(false);
      setCompleted(true);
      if (navigator.vibrate) navigator.vibrate(50);
      toast("Surrendered. He's with you.");
      setTimeout(onComplete, 600);
    }, 1500);
  }, [completed, onComplete]);

  const cancelHold = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    if (!completed) setHolding(false);
  }, [completed]);

  return (
    <div className="flex flex-col items-center w-full max-w-sm">
      <Eyebrow>Surrender</Eyebrow>
      <div style={{ marginBottom: "36px", width: "100%" }}>
        {lines.map((line, i) => {
          const isLast = i === visibleLines - 1;
          const shown = i < visibleLines;
          return (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{
                opacity: shown ? (isLast ? 1 : 0.55) : 0,
                y: shown ? 0 : 6,
              }}
              transition={{ duration: 0.4 }}
              style={{
                fontFamily: serifFont,
                fontStyle: "italic",
                fontSize: "22px",
                lineHeight: 1.5,
                color: "#F5F3EE",
                textAlign: "center",
                marginBottom: "14px",
              }}
            >
              {line}
            </motion.p>
          );
        })}
      </div>

      <button
        onMouseDown={startHold}
        onMouseUp={cancelHold}
        onMouseLeave={cancelHold}
        onTouchStart={startHold}
        onTouchEnd={cancelHold}
        onTouchCancel={cancelHold}
        disabled={visibleLines < lines.length}
        style={{
          position: "relative",
          width: "100%",
          padding: "16px",
          borderRadius: "12px",
          border: "none",
          fontSize: "15px",
          fontWeight: 600,
          fontFamily: sansFont,
          cursor: "pointer",
          background: completed ? "#B8963F" : "#F5F3EE",
          color: "#1A1A1A",
          overflow: "hidden",
          outline: "none",
          boxShadow: "none",
          WebkitUserSelect: "none",
          userSelect: "none",
          opacity: visibleLines < lines.length ? 0.5 : 1,
          transition: "opacity 0.3s ease",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            borderRadius: "12px",
            background: "#B8963F",
            width: holding ? "100%" : "0%",
            transition: holding ? "width 1.5s linear" : "none",
          }}
        />
        <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          {completed ? <><Check className="w-4 h-4" /> Surrendered</> : "Hold to Surrender"}
        </span>
      </button>
    </div>
  );
};

const YieldStep = ({ onSelect }: { onSelect: (type: string) => void }) => {
  const options: { label: string; value: string }[] = [
    { label: "Take a walk", value: "take_a_walk" },
    { label: "Pray, don't panic", value: "pray_dont_panic" },
    { label: "Reach out, don't isolate", value: "reach_out_dont_isolate" },
  ];

  return (
    <div className="flex flex-col items-center w-full max-w-sm">
      <Eyebrow>Yield</Eyebrow>
      <h2
        style={{
          fontFamily: serifFont,
          fontSize: "28px",
          fontWeight: 500,
          color: "#F5F3EE",
          textAlign: "center",
          marginBottom: "32px",
          lineHeight: 1.3,
        }}
      >
        What is He prompting?
      </h2>

      <div className="flex flex-col gap-3 w-full">
        {options.map((opt) => (
          <motion.button
            key={opt.value}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(opt.value)}
            style={{
              width: "100%",
              background: "#242424",
              border: "none",
              borderLeft: "3px solid hsl(var(--primary))",
              borderRadius: "0 12px 12px 0",
              padding: "18px 20px",
              color: "#F5F3EE",
              fontFamily: sansFont,
              fontSize: "16px",
              fontWeight: 500,
              textAlign: "left",
              cursor: "pointer",
              outline: "none",
            }}
          >
            {opt.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

const AbideStep = ({ onReceive, isPending }: { onReceive: () => void; isPending: boolean }) => (
  <div className="flex flex-col items-center w-full max-w-sm">
    <Eyebrow>Abide</Eyebrow>
    <h2
      style={{
        fontFamily: serifFont,
        fontSize: "26px",
        fontWeight: 500,
        color: "#F5F3EE",
        textAlign: "center",
        marginBottom: "36px",
        lineHeight: 1.35,
      }}
    >
      He is with you. Walk in that.
    </h2>

    <p
      style={{
        fontFamily: serifFont,
        fontStyle: "italic",
        fontSize: "22px",
        color: "#F5F3EE",
        textAlign: "center",
        lineHeight: 1.5,
        marginBottom: "10px",
      }}
    >
      "Abide in me, and I in you."
    </p>
    <p
      style={{
        fontFamily: serifFont,
        fontSize: "14px",
        letterSpacing: "0.08em",
        color: "hsl(var(--primary))",
        textAlign: "center",
        marginBottom: "40px",
      }}
    >
      John 15:4 (ESV)
    </p>

    <button
      onClick={onReceive}
      disabled={isPending}
      style={{
        background: "hsl(var(--primary))",
        color: "#1A1A1A",
        fontFamily: sansFont,
        fontWeight: 600,
        fontSize: "15px",
        border: "none",
        borderRadius: "999px",
        padding: "14px 40px",
        cursor: isPending ? "default" : "pointer",
        outline: "none",
        boxShadow: "none",
        opacity: isPending ? 0.7 : 1,
      }}
    >
      I receive it.
    </button>
  </div>
);

const WalkWithSpiritModal = ({ onClose }: Props) => {
  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addEvidence } = useEvidenceCounter();

  const handleYield = async (yieldType: string) => {
    if (user) {
      try {
        await supabase.from("yield_logs" as any).insert({
          user_id: user.id,
          yield_type: yieldType,
          custom_text: null,
        });
      } catch (e) {
        // non-blocking
      }
    }
    setStep(2);
  };

  const handleReceive = async () => {
    if (pending) return;
    setPending(true);
    try {
      await addEvidence.mutateAsync("declaration");
    } catch (e) {
      // non-blocking
    }
    onClose();
    navigate("/app");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-fullscreen"
      style={{ background: "linear-gradient(180deg, #1C1C1C 0%, #161616 100%)" }}
    >
      <button
        onClick={onClose}
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 60,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          outline: "none",
          boxShadow: "none",
        }}
      >
        <X style={{ width: 20, height: 20, color: "rgba(245,243,238,0.5)" }} />
      </button>

      <div className="modal-fullscreen-body flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="w-full flex justify-center"
          >
            {step === 0 && <SurrenderStep onComplete={() => setStep(1)} />}
            {step === 1 && <YieldStep onSelect={handleYield} />}
            {step === 2 && <AbideStep onReceive={handleReceive} isPending={pending} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default WalkWithSpiritModal;