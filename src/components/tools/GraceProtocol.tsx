import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, MessageCircle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useFreedomStreak } from "@/hooks/useDailyProgress";
import { useRelapseEventLogger } from "@/hooks/useTriggerPatterns";

const TOTAL_STEPS = 6;

const headerQuote = "Grace is not a reward for the strong. It is the lifeline for the broken.";

const triggerOptions = [
  "I was alone.",
  "I was stressed.",
  "I was bored.",
  "I was emotionally low.",
  "I was physically tired.",
  "I chose it gradually.",
];

interface GraceProtocolProps {
  onClose: () => void;
}

const GraceProtocol = ({ onClose }: GraceProtocolProps) => {
  const [step, setStep] = useState(0);
  const [confession, setConfession] = useState("");
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const navigate = useNavigate();
  const { resetStreak } = useFreedomStreak();
  const { logRelapseEvent } = useRelapseEventLogger();

  const next = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
  };

  const handleSkipToReset = async () => {
    await logRelapseEvent.mutateAsync();
    await resetStreak.mutateAsync();
    setShowCompletion(true);
  };

  const handleFinalReset = async () => {
    await logRelapseEvent.mutateAsync();
    await resetStreak.mutateAsync();
    setShowCompletion(true);
  };

  const toggleTrigger = (t: string) => {
    setSelectedTriggers((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  if (showCompletion) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-[hsl(225_12%_6%)] flex flex-col items-center justify-center px-6"
      >
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-8"
          style={{ boxShadow: "0 0 60px hsl(40 44% 54% / 0.3), 0 0 120px hsl(40 44% 54% / 0.15)" }}
        >
          <Heart className="w-12 h-12 text-primary" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="font-serif text-3xl font-bold text-white text-center mb-3"
        >
          Grace received.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-white/60 text-center mb-8"
        >
          Your journey continues.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <Button
            onClick={() => { onClose(); navigate("/app"); }}
            className="bg-primary text-[#0A0A0A] font-bold rounded-xl h-12 px-8 hover:bg-primary/90"
          >
            Return Home
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[hsl(225_12%_6%)] flex flex-col"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between p-4">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <X className="w-5 h-5 text-white/50" />
        </button>
        <p className="text-xs text-white/30 font-medium">Grace Protocol</p>
        <div className="w-9" />
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 px-6 mb-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-colors duration-300",
              i <= step ? "bg-primary" : "bg-white/15"
            )}
          />
        ))}
      </div>

      {/* Header quote */}
      <p className="text-xs text-primary/50 text-center px-8 mb-4 italic">
        {headerQuote}
      </p>

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center px-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <StepWrapper key="s1">
              <h2 className="font-serif text-2xl font-bold text-white mb-4 text-center">
                Stop. You are still His.
              </h2>
              <p className="text-sm text-white/70 leading-relaxed text-center mb-6 max-w-sm">
                Before anything else, receive this: there is no condemnation for those who are in Christ Jesus. Not after this. Not ever.
              </p>
              <ScriptureBlock
                text="Therefore, there is now no condemnation for those who are in Christ Jesus."
                ref="Romans 8:1 (ESV)"
              />
              <Button onClick={next} className="w-full mt-8 rounded-xl font-bold h-12 text-base bg-primary text-[#0A0A0A] hover:bg-primary/90 shadow-lg shadow-primary/20">
                I receive this. Continue.
              </Button>
            </StepWrapper>
          )}

          {step === 1 && (
            <StepWrapper key="s2">
              <h2 className="font-serif text-2xl font-bold text-white mb-4 text-center">
                Name it without hiding.
              </h2>
              <p className="text-sm text-white/70 leading-relaxed text-center mb-6 max-w-sm">
                God already knows. This is not confession to earn forgiveness. You already have it. This is honesty that breaks shame's power.
              </p>
              <textarea
                value={confession}
                onChange={(e) => setConfession(e.target.value)}
                placeholder="What happened? Write it plainly."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/90 placeholder:text-white/25 resize-none focus:outline-none focus:border-primary/50 transition-colors mb-3"
                rows={3}
              />
              <p className="text-xs text-white/40 text-center mb-6">
                Shame lives in secrecy. Truth lives in light.
              </p>
              <Button onClick={next} className="w-full rounded-xl font-bold h-12 text-base bg-primary text-[#0A0A0A] hover:bg-primary/90 shadow-lg shadow-primary/20">
                I have named it. Continue.
              </Button>
            </StepWrapper>
          )}

          {step === 2 && (
            <StepWrapper key="s3">
              <h2 className="font-serif text-2xl font-bold text-white mb-4 text-center">
                Shame is a liar.
              </h2>
              <p className="text-sm text-white/70 leading-relaxed text-center mb-6 max-w-sm">
                Your failure is not your identity. You are not what you just did. Speak this out loud:
              </p>
              <div className="bg-white/5 border border-primary/20 rounded-xl p-6 mb-8">
                <p className="font-serif text-lg font-bold text-white leading-relaxed text-center">
                  I am not condemned. I am not defined by this moment. I am a son of God walking toward freedom.
                </p>
              </div>
              <Button onClick={next} className="w-full rounded-xl font-bold h-12 text-base bg-primary text-[#0A0A0A] hover:bg-primary/90 shadow-lg shadow-primary/20">
                I declare this. Continue.
              </Button>
            </StepWrapper>
          )}

          {step === 3 && (
            <StepWrapper key="s4">
              <h2 className="font-serif text-2xl font-bold text-white mb-4 text-center">
                What led here?
              </h2>
              <p className="text-sm text-white/70 leading-relaxed text-center mb-6 max-w-sm">
                Not to punish yourself. But to close the door. Understanding your trigger is an act of wisdom, not weakness.
              </p>
              <div className="space-y-2.5 mb-4 w-full max-w-sm">
                {triggerOptions.map((t) => (
                  <motion.button
                    key={t}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => toggleTrigger(t)}
                    className={cn(
                      "w-full p-3.5 rounded-xl text-left text-sm font-medium transition-colors",
                      selectedTriggers.includes(t)
                        ? "bg-primary text-[#0A0A0A]"
                        : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                    )}
                  >
                    {t}
                  </motion.button>
                ))}
              </div>
              <p className="text-xs text-white/30 text-center mb-6 max-w-sm">
                This is stored privately in Your Patterns to help you see what the Spirit may be showing you over time.
              </p>
              <Button onClick={next} className="w-full rounded-xl font-bold h-12 text-base bg-primary text-[#0A0A0A] hover:bg-primary/90 shadow-lg shadow-primary/20 max-w-sm">
                I see it. Continue.
              </Button>
            </StepWrapper>
          )}

          {step === 4 && (
            <StepWrapper key="s5">
              <h2 className="font-serif text-2xl font-bold text-white mb-4 text-center">
                You were not made to carry this alone.
              </h2>
              <p className="text-sm text-white/70 leading-relaxed text-center mb-6 max-w-sm">
                Brotherhood is not optional in recovery. It is essential. One honest message to a brother right now breaks isolation's grip.
              </p>
              <div className="space-y-3 w-full max-w-sm mb-6">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { onClose(); navigate("/brotherhood"); }}
                  className="w-full p-4 rounded-xl bg-primary text-[#0A0A0A] font-semibold flex items-center gap-3"
                >
                  <MessageCircle className="w-5 h-5" />
                  Message a brother now
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={next}
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white font-semibold flex items-center gap-3 hover:bg-white/10 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  I will connect today
                </motion.button>
              </div>
              <Button onClick={next} className="w-full rounded-xl font-bold h-12 text-base bg-primary text-[#0A0A0A] hover:bg-primary/90 shadow-lg shadow-primary/20 max-w-sm">
                Continue
              </Button>
            </StepWrapper>
          )}

          {step === 5 && (
            <StepWrapper key="s6">
              <h2 className="font-serif text-2xl font-bold text-white mb-4 text-center">
                Today is still Day 1 of the rest of your freedom.
              </h2>
              <p className="text-sm text-white/70 leading-relaxed text-center mb-6 max-w-sm">
                The enemy wants you to believe this fall disqualifies you. It does not. Grace restores. The Spirit leads. You return. Not in defeat. But in faith.
              </p>
              <ScriptureBlock
                text="Do not gloat over me, my enemy! Though I have fallen, I will rise."
                ref="Micah 7:8 (ESV)"
              />
              <div className="bg-white/5 border border-primary/20 rounded-xl p-6 mt-6 mb-8 max-w-sm">
                <p className="font-serif text-lg font-bold text-white leading-relaxed text-center">
                  I rise. I return. I am free in Christ.
                </p>
              </div>
              <Button
                onClick={handleFinalReset}
                disabled={resetStreak.isPending || logRelapseEvent.isPending}
                className="w-full rounded-xl font-bold h-12 text-base bg-primary text-[#0A0A0A] hover:bg-primary/90 shadow-lg shadow-primary/20 max-w-sm"
              >
                I rise. Reset my journey.
              </Button>
            </StepWrapper>
          )}
        </AnimatePresence>
      </div>

      {/* Skip option */}
      <div className="p-4 text-center">
        <button
          onClick={handleSkipToReset}
          disabled={resetStreak.isPending || logRelapseEvent.isPending}
          className="text-xs text-white/25 hover:text-white/40 transition-colors"
        >
          Skip to reset.
        </button>
      </div>
    </motion.div>
  );
};

// ========== Sub-components ==========

const StepWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="flex flex-col items-center w-full max-w-md"
  >
    {children}
  </motion.div>
);

const ScriptureBlock = ({ text, ref: reference }: { text: string; ref: string }) => (
  <div className="bg-white/5 border border-primary/20 rounded-xl p-5 w-full max-w-sm">
    <p className="font-serif text-sm text-primary italic leading-relaxed">
      "{text}"
    </p>
    <p className="text-xs text-primary/70 mt-2 font-medium">{reference}</p>
  </div>
);

export default GraceProtocol;
