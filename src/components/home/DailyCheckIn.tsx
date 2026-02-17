import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDailyCheckIn } from "@/hooks/useDailyProgress";

const awarenessOptions = [
  { id: "rested", label: "Rested" },
  { id: "ashamed", label: "Ashamed" },
  { id: "calm", label: "Calm" },
  { id: "anxious", label: "Anxious" },
  { id: "connected", label: "Connected" },
  { id: "isolated", label: "Isolated" },
  { id: "hopeful", label: "Hopeful" },
  { id: "discouraged", label: "Discouraged" },
  { id: "grateful", label: "Grateful" },
  { id: "tempted", label: "Tempted" },
];

const scriptureResponses: Record<string, { text: string; ref: string }> = {
  anxious: {
    text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.",
    ref: "Philippians 4:6-7",
  },
  ashamed: {
    text: "There is therefore now no condemnation for those who are in Christ Jesus.",
    ref: "Romans 8:1",
  },
  tempted: {
    text: "No temptation has overtaken you that is not common to man. God is faithful, and he will not let you be tempted beyond your ability, but with the temptation he will also provide the way of escape, that you may be able to endure it.",
    ref: "1 Corinthians 10:13",
  },
  isolated: {
    text: "And let us consider how to stir up one another to love and good works, not neglecting to meet together, as is the habit of some, but encouraging one another.",
    ref: "Hebrews 10:24-25",
  },
  discouraged: {
    text: "Fear not, for I am with you; be not dismayed, for I am your God; I will strengthen you, I will help you, I will uphold you with my righteous right hand.",
    ref: "Isaiah 41:10",
  },
  rested: {
    text: "He makes me lie down in green pastures. He leads me beside still waters. He restores my soul.",
    ref: "Psalm 23:2-3",
  },
  calm: {
    text: "You keep him in perfect peace whose mind is stayed on you, because he trusts in you.",
    ref: "Isaiah 26:3",
  },
  connected: {
    text: "For where two or three are gathered in my name, there am I among them.",
    ref: "Matthew 18:20",
  },
  hopeful: {
    text: "For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope.",
    ref: "Jeremiah 29:11",
  },
  grateful: {
    text: "Give thanks in all circumstances; for this is the will of God in Christ Jesus for you.",
    ref: "1 Thessalonians 5:18",
  },
};

interface DailyCheckInProps {
  onComplete: () => void;
  onNeedSupport: () => void;
}

const DailyCheckIn = ({ onComplete, onNeedSupport }: DailyCheckInProps) => {
  const [step, setStep] = useState(0);
  const [selectedAwareness, setSelectedAwareness] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const [showBreathText, setShowBreathText] = useState(false);
  const [spiritPrompt, setSpiritPrompt] = useState("");
  const [showBreakthroughMsg, setShowBreakthroughMsg] = useState(false);
  const { isCheckedIn, submitCheckIn } = useDailyCheckIn();

  // Randomize tile order once per session
  const shuffledOptions = useMemo(() => {
    const arr = [...awarenessOptions];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, []);

  // Get the most relevant scripture for selected emotions
  const activeScripture = useMemo(() => {
    const prioritized = ["ashamed", "tempted", "anxious", "isolated", "discouraged"];
    for (const id of prioritized) {
      if (selectedAwareness.includes(id)) return scriptureResponses[id];
    }
    const last = selectedAwareness[selectedAwareness.length - 1];
    return last ? scriptureResponses[last] : null;
  }, [selectedAwareness]);

  if (isCheckedIn && !completed) {
    return null;
  }

  const toggleAwareness = (id: string) => {
    setSelectedAwareness((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const needsSupport = selectedAwareness.some((a) =>
    ["anxious", "tempted", "isolated", "discouraged", "ashamed"].includes(a)
  );

  const handleComplete = async () => {
    await submitCheckIn.mutateAsync({
      feelings: selectedAwareness,
      needsSupport,
      spiritResponse: spiritPrompt.trim() || undefined,
    });
    const hadBreakthrough = spiritPrompt.trim().length > 0;
    setCompleted(true);
    setShowBreakthroughMsg(hadBreakthrough);
    setTimeout(() => onComplete(), hadBreakthrough ? 2500 : 1500);
  };

  if (completed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl p-8 text-center bg-[hsl(225_12%_8%)]"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Check className="w-8 h-8 text-primary-foreground" />
        </motion.div>
        <h3 className="font-serif text-2xl font-semibold mb-2 text-white">You are seen.</h3>
        <p className="text-white/60">
          {showBreakthroughMsg
            ? "Breakthrough moment recorded. Your King Profile has grown."
            : "Grace meets you here. One step at a time."}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="rounded-2xl p-6 bg-[hsl(225_12%_8%)] text-white -mx-6" style={{ borderRadius: 0, paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Heart className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-serif text-lg font-semibold text-white">Daily Check-In</h3>
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="awareness"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <p className="text-white/60 mb-1">
              What is present in you right now?
            </p>
            <p className="text-xs text-white/40 mb-4">Select all that apply.</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {shuffledOptions.map((option) => {
                const isSelected = selectedAwareness.includes(option.id);
                return (
                  <motion.button
                    key={option.id}
                    onClick={() => toggleAwareness(option.id)}
                    animate={{ scale: isSelected ? 1.02 : 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={cn(
                      "relative flex items-center gap-3 p-3 rounded-xl transition-colors duration-150 text-left",
                      isSelected
                        ? "bg-primary text-[#0A0A0A] font-bold"
                        : "bg-[hsl(225_12%_10%)] text-white"
                    )}
                    style={{ border: "1.5px solid hsl(40 44% 54%)" }}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#0A0A0A] ml-auto" />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Contextual Scripture */}
            <AnimatePresence>
              {activeScripture && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <div className="bg-white/5 border border-primary/20 rounded-xl p-4">
                    <p className="font-serif text-sm text-white/80 italic leading-relaxed">
                      "{activeScripture.text}"
                    </p>
                    <p className="text-xs text-primary mt-2 font-medium">{activeScripture.ref}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {showBreathText && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-white/50 text-center mb-4"
              >
                Awareness builds strength.
              </motion.p>
            )}

            <div className="flex gap-3">
              <motion.div className="flex-1" whileTap={{ scale: 0.97, y: -1 }}>
                <Button
                  onClick={() => {
                    setShowBreathText(true);
                    setTimeout(() => setStep(1), 1000);
                  }}
                  disabled={selectedAwareness.length === 0}
                  className={cn(
                    "w-full rounded-xl font-semibold h-12 text-base transition-all duration-200",
                    selectedAwareness.length === 0
                      ? "bg-white/10 text-white/30 hover:bg-white/10"
                      : "bg-primary text-[#0A0A0A] font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_1]"
                  )}
                >
                  {selectedAwareness.length === 0 ? "Select to align" : "I am aligned. Let's Go."}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="spirit-prompt"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <p className="text-white/80 font-serif text-lg mb-2">
              What do you sense the Spirit saying about what you are feeling?
            </p>
            <p className="text-xs text-white/40 mb-4">This is optional. Listen quietly.</p>
            
            <textarea
              value={spiritPrompt}
              onChange={(e) => setSpiritPrompt(e.target.value)}
              placeholder="Write what comes to mind..."
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/90 placeholder:text-white/25 resize-none focus:outline-none focus:border-primary/50 transition-colors"
              rows={3}
            />

            <div className="flex flex-col gap-3 mt-4">
              <Button
                onClick={handleComplete}
                disabled={submitCheckIn.isPending}
                className="w-full rounded-xl font-semibold h-12 text-base bg-primary text-[hsl(225_12%_8%)] hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                <Check className="w-4 h-4" />
                Complete Check-In
              </Button>
              <button
                onClick={handleComplete}
                disabled={submitCheckIn.isPending}
                className="text-sm text-white/40 hover:text-white/60 transition-colors py-2"
              >
                I will listen throughout the day
              </button>
              {needsSupport && (
                <Button
                  onClick={onNeedSupport}
                  className="w-full rounded-xl font-medium h-11 bg-white/10 text-white hover:bg-white/15 border border-white/10"
                >
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