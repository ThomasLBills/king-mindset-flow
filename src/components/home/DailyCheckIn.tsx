import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, ChevronRight, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDailyCheckIn } from "@/hooks/useDailyProgress";

const awarenessOptions = [
  { id: "rested", label: "Rested" },
  { id: "drained", label: "Drained" },
  { id: "calm", label: "Calm" },
  { id: "anxious", label: "Anxious" },
  { id: "connected", label: "Connected" },
  { id: "isolated", label: "Isolated" },
  { id: "hopeful", label: "Hopeful" },
  { id: "discouraged", label: "Discouraged" },
  { id: "grateful", label: "Grateful" },
  { id: "pressured", label: "Pressured" },
];

interface DailyCheckInProps {
  onComplete: () => void;
  onNeedSupport: () => void;
}

const DailyCheckIn = ({ onComplete, onNeedSupport }: DailyCheckInProps) => {
  const [step, setStep] = useState(0);
  const [selectedAwareness, setSelectedAwareness] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const [showBreathText, setShowBreathText] = useState(false);
  const { isCheckedIn, submitCheckIn } = useDailyCheckIn();

  // If already checked in today, signal parent
  if (isCheckedIn && !completed) {
    // Already done for today
    return null;
  }

  const toggleAwareness = (id: string) => {
    setSelectedAwareness((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const needsSupport = selectedAwareness.some((a) =>
    ["anxious", "pressured", "isolated", "discouraged", "drained"].includes(a)
  );

  const handleComplete = async () => {
    await submitCheckIn.mutateAsync({
      feelings: selectedAwareness,
      needsSupport,
    });
    setCompleted(true);
    setTimeout(() => onComplete(), 1500);
  };

  if (completed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-elevated p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Check className="w-8 h-8 text-success-foreground" />
        </motion.div>
        <h3 className="font-serif text-2xl font-semibold mb-2">You are seen.</h3>
        <p className="text-muted-foreground">Grace meets you here. One step at a time.</p>
      </motion.div>
    );
  }

  return (
    <div className="card-elevated p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
          <Heart className="w-4 h-4 text-accent" />
        </div>
        <h3 className="font-serif text-lg font-semibold">Daily Check-In</h3>
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="awareness"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <p className="text-muted-foreground mb-1">
              What is present in you right now?
            </p>
            <p className="text-xs text-muted-foreground/70 mb-4">Select all that apply.</p>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {awarenessOptions.map((option) => {
                const isSelected = selectedAwareness.includes(option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => toggleAwareness(option.id)}
                    className={cn(
                      "relative flex items-center gap-3 p-3 rounded-xl border transition-colors duration-150 text-left",
                      isSelected
                        ? "border-primary bg-primary/8 text-foreground"
                        : "border-border hover:border-primary/30 hover:bg-muted/50 text-foreground"
                    )}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-primary ml-auto" />
                    )}
                  </button>
                );
              })}
            </div>

            {showBreathText && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-muted-foreground text-center mb-4"
              >
                Awareness builds strength.
              </motion.p>
            )}

            <div className="flex gap-3">
              <Button
                variant="calm"
                onClick={() => {
                  setShowBreathText(true);
                  setTimeout(() => setStep(1), 1000);
                }}
                disabled={selectedAwareness.length === 0}
                className="flex-1"
              >
                Align Today
              </Button>
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="next-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="bg-secondary/50 rounded-xl p-4 mb-4">
              <p className="text-sm text-muted-foreground mb-1">Today's Next Step</p>
              <p className="font-medium">
                {needsSupport
                  ? "Take 5 minutes to breathe and remember: you are not alone."
                  : "Stay present. Walk in awareness today."}
              </p>
            </div>

            <p className="scripture-text text-sm mb-6 px-2">
              "His mercies are new every morning; great is His faithfulness."
              <span className="block text-xs mt-1 not-italic">— Lamentations 3:23</span>
            </p>

            <div className="flex flex-col gap-3">
              <Button variant="tool" onClick={handleComplete} className="w-full" disabled={submitCheckIn.isPending}>
                <Check className="w-4 h-4" />
                Complete Check-In
              </Button>
              {needsSupport && (
                <Button variant="brotherhood" onClick={onNeedSupport} className="w-full">
                  <Heart className="w-4 h-4" />
                  I need support today
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DailyCheckIn;
