import { useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCrisisEventLogger } from "@/hooks/useTriggerPatterns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEvidenceCounter } from "@/hooks/useEvidenceCounter";


const feelingOptions = [
  { id: "pressure", label: "I feel pressure" },
  { id: "tired", label: "I'm tired" },
  { id: "relief", label: "I'm seeking relief" },
];

const truthStatements = [
  "This urge does not define me. I am safe. This feeling will pass.",
  "I am a new creation in Christ. This urge does not control me.",
  "I am a son, not a slave. I don't need porn. I need to remember who I am.",
  "This feeling is temporary. My identity in Christ is permanent.",
  "I don't need relief from porn. I need to redirect this energy toward life.",
  "The urge is strong. The Spirit is stronger. I am not alone in this moment.",
];

const actionButtons = [
  {
    id: "environment",
    title: "Change environments",
    subtitle: "Stand up. Walk outside.",
    helper: "Physical movement interrupts the pattern. Get up now.",
  },
  {
    id: "breathe",
    title: "Slow the body",
    subtitle: "Take three deep breaths.",
    helper: "Slow breathing calms the nervous system. Breathe with me: In for 4. Hold for 4. Out for 6.",
  },
  {
    id: "engage",
    title: "Engage in action",
    subtitle: "Text a brother. Pray. Do 10 pushups.",
    helper: "Connect with something real. Break isolation. Move your body.",
  },
];

const systemSans = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

const StepWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="flex flex-col w-full max-w-sm greeting-sans"
    style={{ fontFamily: systemSans }}
  >
    {children}
  </motion.div>
);

// ========== NAVIGATE STEP WITH HOLD-TO-CONFIRM ==========
interface NavigateStepProps {
  selectedAction: string | null;
  setSelectedAction: (id: string | null) => void;
  onVictory: () => void;
  isPending: boolean;
}

const NavigateStep = ({ selectedAction, setSelectedAction, onVictory, isPending }: NavigateStepProps) => {
  const [holding, setHolding] = useState(false);
  const [completed, setCompleted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startHold = useCallback(() => {
    if (completed || isPending || !selectedAction) return;
    setHolding(true);
    timerRef.current = setTimeout(() => {
      setHolding(false);
      setCompleted(true);
      if (navigator.vibrate) navigator.vibrate(50);
      onVictory();
    }, 2000);
  }, [completed, isPending, selectedAction, onVictory]);

  const cancelHold = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    if (!completed) setHolding(false);
  }, [completed]);

  return (
    <StepWrapper key="navigate">
      <h2 style={{ fontFamily: systemSans, fontWeight: 600, fontSize: "26px", color: "#F5F3EE", letterSpacing: "-0.02em", marginBottom: "4px" }}>Navigate</h2>
      <p style={{ fontSize: "14px", fontWeight: 500, color: "hsl(var(--primary))", marginBottom: "16px" }}>Choose The Next Aligned Step</p>
      <p style={{ fontSize: "15px", fontWeight: 400, color: "#F5F3EE", marginBottom: "20px", lineHeight: 1.5 }}>
        This is where you redirect. Choose one small, embodied response:
      </p>
      <div className="w-full" style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
        {actionButtons.map((action) => {
          const isSelected = selectedAction === action.id;
          return (
            <div key={action.id}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedAction(isSelected ? null : action.id)}
                style={{
                  width: "100%",
                  padding: "18px 20px",
                  borderRadius: isSelected ? "0 12px 12px 0" : "12px",
                  background: isSelected ? "rgba(184, 150, 63, 0.15)" : "#242424",
                  border: "none",
                  borderLeft: isSelected ? "3px solid hsl(var(--primary))" : "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontFamily: systemSans,
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ display: "block", color: "#F5F3EE", fontSize: "16px", fontWeight: 600 }}>{action.title}</span>
                <span style={{ display: "block", color: "hsl(var(--primary))", fontSize: "13px", fontWeight: 400, marginTop: "2px" }}>{action.subtitle}</span>
              </motion.button>
              <AnimatePresence>
                {isSelected && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ fontSize: "14px", color: "#F5F3EE", marginTop: "8px", paddingLeft: "20px", paddingRight: "4px", lineHeight: 1.5, overflow: "hidden" }}
                  >
                    {action.helper}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: "14px", fontWeight: 400, color: "#F5F3EE", marginBottom: "24px", lineHeight: 1.5 }}>
        You're not trying to beat the urge. You're practicing a different pathway.{" "}
        <span style={{ color: "hsl(var(--primary))" }}>Every time you practice, the new pathway gets stronger.</span>
      </p>

      {/* Hold-to-confirm button */}
      <button
        onMouseDown={startHold}
        onMouseUp={cancelHold}
        onMouseLeave={cancelHold}
        onTouchStart={startHold}
        onTouchEnd={cancelHold}
        onTouchCancel={cancelHold}
        disabled={!selectedAction || isPending}
        style={{
          position: "relative",
          width: "100%",
          padding: "16px",
          borderRadius: "12px",
          border: "none",
          fontSize: "15px",
          fontWeight: 600,
          fontFamily: systemSans,
          cursor: selectedAction ? "pointer" : "not-allowed",
          background: completed ? "#B8963F" : "#F5F3EE",
          color: "#1A1A1A",
          overflow: "hidden",
          outline: "none",
          opacity: selectedAction ? 1 : 0.4,
          transition: "opacity 0.2s ease",
          WebkitUserSelect: "none",
          userSelect: "none",
        }}
      >
        {/* Gold fill */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            borderRadius: "12px",
            background: "#B8963F",
            width: holding ? "100%" : "0%",
            transition: holding ? "width 2s linear" : "width 0.15s ease-out",
          }}
        />
        <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          {completed ? (
            <>
              <Check className="w-4 h-4" /> Redirected
            </>
          ) : (
            "Hold to Redirect"
          )}
        </span>
      </button>
    </StepWrapper>
  );
};

export const SpiritLedCrisisModal = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState(0);
  const [selectedFeelings, setSelectedFeelings] = useState<string[]>([]);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [showVictory, setShowVictory] = useState(false);
  const { logCrisisEvent } = useCrisisEventLogger();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { addEvidence } = useEvidenceCounter();
  
  const navigate = useNavigate();

  const selectedTruth = useMemo(
    () => truthStatements[Math.floor(Math.random() * truthStatements.length)],
    [step]
  );

  const recordVictory = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const { error } = await supabase.from("daily_completions").insert({
        user_id: user.id,
        completion_date: today,
        category: "crisis_breakthrough",
        item_id: `crisis-${Date.now()}`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["king-profile-breakthroughs-crisis"] });
    },
  });

  const toggleFeeling = (id: string) => {
    setSelectedFeelings((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleVictory = async () => {
    recordVictory.mutate();
    addEvidence.mutate("declaration");
    setShowVictory(true);
    setTimeout(() => {
      onClose();
      navigate("/app");
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-fullscreen bg-[#111111]"
    >
      {/* Victory Overlay */}
      <AnimatePresence>
        {showVictory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-[#111111]"
          >
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="font-serif text-2xl font-bold text-white mb-3 text-center"
            >
              New pathway strengthened.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white text-base text-center"
            >
              You are building evidence.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close button */}
      <div className="flex justify-end" style={{ padding: "20px 20px 0 20px" }}>
        <button onClick={onClose} className="transition-opacity hover:opacity-70" style={{ background: "none", border: "none", padding: 0 }}>
          <X className="w-6 h-6" style={{ color: "rgba(245, 243, 238, 0.5)" }} />
        </button>
      </div>

      <div className="modal-fullscreen-body">
        <AnimatePresence mode="wait">
          {/* STEP 1: NOTICE */}
          {step === 0 && (
            <StepWrapper key="notice">
              <h2 style={{ fontFamily: systemSans, fontWeight: 600, fontSize: "26px", color: "#F5F3EE", letterSpacing: "-0.02em", marginBottom: "4px" }}>Notice</h2>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "hsl(var(--primary))", marginBottom: "16px" }}>Awareness Without Judgment</p>
              <p style={{ fontSize: "15px", fontWeight: 400, color: "#F5F3EE", marginBottom: "20px", lineHeight: 1.5 }}>
                The first step is awareness without judgment. Identify what's happening:
              </p>
              <div className="w-full" style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                {feelingOptions.map((opt) => {
                  const isSelected = selectedFeelings.includes(opt.id);
                  return (
                    <motion.button
                      key={opt.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggleFeeling(opt.id)}
                      style={{
                        width: "100%",
                        padding: "16px 20px",
                        borderRadius: isSelected ? "0 12px 12px 0" : "12px",
                        background: isSelected ? "rgba(184, 150, 63, 0.15)" : "#242424",
                        border: "none",
                        borderLeft: isSelected ? "3px solid hsl(var(--primary))" : "none",
                        color: "#F5F3EE",
                        fontSize: "15px",
                        fontWeight: 500,
                        textAlign: "left",
                        cursor: "pointer",
                        fontFamily: systemSans,
                        transition: "all 0.15s ease",
                        outline: "none",
                      }}
                    >
                      {opt.label}
                    </motion.button>
                  );
                })}
              </div>
              <p style={{ fontSize: "14px", fontWeight: 400, color: "#F5F3EE", marginBottom: "6px", lineHeight: 1.5 }}>
                You're not analyzing. You're not condemning yourself. You're simply naming the experience.
              </p>
              <p style={{ fontSize: "14px", fontWeight: 400, color: "hsl(var(--primary))", marginBottom: "24px", lineHeight: 1.5 }}>
                Naming creates distance. Distance reduces compulsion.
              </p>
              <button
                onClick={() => setStep(1)}
                disabled={selectedFeelings.length === 0}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "none",
                  fontSize: "15px",
                  fontWeight: selectedFeelings.length > 0 ? 600 : 500,
                  fontFamily: systemSans,
                  cursor: selectedFeelings.length > 0 ? "pointer" : "not-allowed",
                  background: selectedFeelings.length > 0 ? "hsl(var(--primary))" : "#242424",
                  color: selectedFeelings.length > 0 ? "#1A1A1A" : "rgba(245, 243, 238, 0.3)",
                  transition: "all 0.2s ease",
                  outline: "none",
                  boxShadow: "none",
                }}
              >
                Continue
              </button>
            </StepWrapper>
          )}

          {/* STEP 2: NAME THE TRUTH */}
          {step === 1 && (
            <StepWrapper key="name">
              <h2 style={{ fontFamily: systemSans, fontWeight: 600, fontSize: "26px", color: "#F5F3EE", letterSpacing: "-0.02em", marginBottom: "4px" }}>Name The Truth</h2>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "hsl(var(--primary))", marginBottom: "16px" }}>Alignment With Reality</p>
              <p style={{ fontSize: "15px", fontWeight: 400, color: "#F5F3EE", marginBottom: "24px", lineHeight: 1.5 }}>
                When you've noticed what's happening, anchor to reality. Speak this truth out loud:
              </p>
              <div style={{ borderLeft: "3px solid hsl(var(--primary))", paddingLeft: "20px", marginBottom: "24px" }}>
                <p style={{ fontSize: "18px", fontWeight: 500, color: "#F5F3EE", lineHeight: 1.5 }}>
                  {selectedTruth}
                </p>
              </div>
              <p style={{ fontSize: "14px", fontWeight: 400, color: "#F5F3EE", marginBottom: "28px", lineHeight: 1.5 }}>
                Truth interrupts the old loop. Your brain has been trained to believe porn provides relief.{" "}
                <span style={{ color: "hsl(var(--primary))" }}>Speaking truth rewrites that belief.</span>
              </p>
              <button
                onClick={() => setStep(2)}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "none",
                  fontSize: "15px",
                  fontWeight: 600,
                  fontFamily: systemSans,
                  cursor: "pointer",
                  background: "hsl(var(--primary))",
                  color: "#1A1A1A",
                  transition: "all 0.2s ease",
                }}
              >
                Continue
              </button>
            </StepWrapper>
          )}

          {/* STEP 3: NAVIGATE */}
          {step === 2 && (
            <NavigateStep
              selectedAction={selectedAction}
              setSelectedAction={setSelectedAction}
              onVictory={handleVictory}
              isPending={recordVictory.isPending}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const SpiritLedCrisisButton = () => {
  const [open, setOpen] = useState(false);
  const { logCrisisEvent } = useCrisisEventLogger();

  return (
    <>
      <motion.button
        onClick={() => { setOpen(true); logCrisisEvent.mutate(undefined); }}
        className="fixed z-40 w-14 h-14 rounded-full bg-primary flex items-center justify-center"
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)",
          right: "20px",
          boxShadow: "0 4px 20px hsl(40 44% 54% / 0.4), 0 0 12px hsl(40 44% 54% / 0.2)",
        }}
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05 }}
      >
        <Shield className="w-6 h-6 text-white" />
      </motion.button>

      <AnimatePresence>
        {open && <SpiritLedCrisisModal onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
};

export default SpiritLedCrisisButton;
