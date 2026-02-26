import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCrisisEventLogger } from "@/hooks/useTriggerPatterns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEvidenceCounter } from "@/hooks/useEvidenceCounter";
import { useUrgeCounter } from "@/hooks/useUrgeCounter";

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

const StepWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="flex flex-col items-center w-full max-w-sm"
  >
    {children}
  </motion.div>
);

export const SpiritLedCrisisModal = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState(0);
  const [selectedFeelings, setSelectedFeelings] = useState<string[]>([]);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [showVictory, setShowVictory] = useState(false);
  const { logCrisisEvent } = useCrisisEventLogger();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { addEvidence } = useEvidenceCounter();
  const { addUrge } = useUrgeCounter();

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
    addUrge.mutate();
    setShowVictory(true);
    setTimeout(() => {
      onClose();
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
      <div className="flex justify-end p-4">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="modal-fullscreen-body">
        <AnimatePresence mode="wait">
          {/* STEP 1: NOTICE */}
          {step === 0 && (
            <StepWrapper key="notice">
              <h2 className="font-serif text-2xl font-bold text-white mb-1 text-center">Notice</h2>
              <p className="text-sm text-white text-center mb-6">Awareness Without Judgment</p>
              <p className="text-sm text-white text-center mb-6 max-w-sm">
                The first step is awareness without judgment. Identify what's happening:
              </p>
              <div className="space-y-3 mb-4 w-full">
                {feelingOptions.map((opt) => (
                  <motion.button
                    key={opt.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => toggleFeeling(opt.id)}
                    className={cn(
                      "w-full p-4 rounded-xl text-center font-medium transition-colors",
                      selectedFeelings.includes(opt.id)
                        ? "bg-primary text-[#0A0A0A]"
                        : "bg-[#1C1C1E] border border-primary/30 text-white"
                    )}
                  >
                    {opt.label}
                  </motion.button>
                ))}
              </div>
              <p className="text-sm text-white text-center mb-2 max-w-sm">
                You're not analyzing. You're not condemning yourself. You're simply naming the experience.
              </p>
              <p className="text-sm text-white text-center mb-6 max-w-sm">
                Naming creates distance. Distance reduces compulsion.
              </p>
              <Button
                onClick={() => setStep(1)}
                disabled={selectedFeelings.length === 0}
                className={cn(
                  "w-full rounded-xl font-bold h-12 text-base transition-colors",
                  selectedFeelings.length > 0
                    ? "bg-primary text-[#0A0A0A] hover:bg-primary/90"
                    : "bg-[#1C1C1E] border border-primary/30 text-white/50 cursor-not-allowed"
                )}
              >
                Continue
              </Button>
            </StepWrapper>
          )}

          {/* STEP 2: NAME THE TRUTH */}
          {step === 1 && (
            <StepWrapper key="name">
              <h2 className="font-serif text-2xl font-bold text-white mb-1 text-center">Name The Truth</h2>
              <p className="text-sm text-white text-center mb-6">Alignment With Reality</p>
              <p className="text-sm text-white text-center mb-6 max-w-sm">
                When you've noticed what's happening, anchor to reality. Speak this truth out loud:
              </p>
              <div className="bg-white/5 border border-primary/20 rounded-xl p-5 w-full mb-4">
                <p className="font-serif text-base text-white leading-relaxed text-center">
                  "{selectedTruth}"
                </p>
              </div>
              <p className="text-sm text-white text-center mb-6 max-w-sm">
                Truth interrupts the old loop. Your brain has been trained to believe porn provides relief. Speaking truth rewrites that belief.
              </p>
              <Button
                onClick={() => setStep(2)}
                className="w-full rounded-xl font-bold h-12 text-base bg-primary text-[#0A0A0A] hover:bg-primary/90"
              >
                Continue
              </Button>
            </StepWrapper>
          )}

          {/* STEP 3: NAVIGATE */}
          {step === 2 && (
            <StepWrapper key="navigate">
              <h2 className="font-serif text-2xl font-bold text-white mb-1 text-center">Navigate</h2>
              <p className="text-sm text-white text-center mb-6">Choose The Next Aligned Step</p>
              <p className="text-sm text-white text-center mb-6 max-w-sm">
                This is where you redirect. Choose one small, embodied response:
              </p>
              <div className="space-y-3 mb-4 w-full">
                {actionButtons.map((action) => (
                  <div key={action.id}>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedAction(selectedAction === action.id ? null : action.id)}
                      className={cn(
                        "w-full p-4 rounded-xl text-center transition-colors",
                        selectedAction === action.id
                          ? "bg-primary text-[#0A0A0A]"
                          : "bg-[#1C1C1E] border border-primary/30 text-white"
                      )}
                    >
                      <span className="block font-medium">{action.title}</span>
                      <span className={cn(
                        "block text-sm mt-1",
                        selectedAction === action.id ? "text-[#0A0A0A]/70" : "text-white/70"
                      )}>{action.subtitle}</span>
                    </motion.button>
                    <AnimatePresence>
                      {selectedAction === action.id && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-sm text-white text-center mt-2 px-2 overflow-hidden"
                        >
                          {action.helper}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
              <p className="text-sm text-white text-center mb-6 max-w-sm">
                You're not trying to beat the urge. You're practicing a different pathway. Every time you practice, the new pathway gets stronger.
              </p>
              <Button
                onClick={handleVictory}
                disabled={recordVictory.isPending}
                className="w-full rounded-xl font-bold h-12 text-base bg-primary text-[#0A0A0A] hover:bg-primary/90"
              >
                I redirected the urge. Record this.
              </Button>
            </StepWrapper>
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
