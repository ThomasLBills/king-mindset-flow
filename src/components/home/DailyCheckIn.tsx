import { useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDailyCheckIn } from "@/hooks/useDailyProgress";

const coreOptions = [
  { id: "hopeful", label: "Hopeful" },
  { id: "grateful", label: "Grateful" },
  { id: "connected", label: "Connected" },
  { id: "peaceful", label: "Peaceful" },
  { id: "calm", label: "Calm" },
  { id: "rested", label: "Rested" },
  { id: "tired", label: "Tired" },
  { id: "anxious", label: "Anxious" },
  { id: "discouraged", label: "Discouraged" },
  { id: "isolated", label: "Isolated" },
  { id: "tempted", label: "Tempted" },
  { id: "ashamed", label: "Ashamed" },
];

const extraOptions = [
  { id: "angry", label: "Angry" },
  { id: "frustrated", label: "Frustrated" },
  { id: "overwhelmed", label: "Overwhelmed" },
  { id: "restless", label: "Restless" },
  { id: "numb", label: "Numb" },
  { id: "lonely", label: "Lonely" },
  { id: "confident", label: "Confident" },
  { id: "convicted", label: "Convicted" },
  { id: "bored", label: "Bored" },
  { id: "stressed", label: "Stressed" },
  { id: "fear", label: "Fear" },
  { id: "rejection", label: "Rejection" },
];

const awarenessOptions = [...coreOptions, ...extraOptions];

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
  tired: {
    text: "Come to me, all who labor and are heavy laden, and I will give you rest.",
    ref: "Matthew 11:28",
  },
  peaceful: {
    text: "Peace I leave with you; my peace I give to you. Not as the world gives do I give to you. Let not your hearts be troubled, neither let them be afraid.",
    ref: "John 14:27",
  },
  angry: {
    text: "Be angry and do not sin; ponder in your own hearts on your beds, and be silent.",
    ref: "Psalm 4:4",
  },
  frustrated: {
    text: "Trust in the Lord with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make straight your paths.",
    ref: "Proverbs 3:5-6",
  },
  overwhelmed: {
    text: "God is our refuge and strength, a very present help in trouble.",
    ref: "Psalm 46:1",
  },
  restless: {
    text: "For God alone my soul waits in silence; from him comes my salvation.",
    ref: "Psalm 62:1",
  },
  numb: {
    text: "And I will give you a new heart, and a new spirit I will put within you. And I will remove the heart of stone from your flesh and give you a heart of flesh.",
    ref: "Ezekiel 36:26",
  },
  lonely: {
    text: "God settles the solitary in a home; he leads out the prisoners to prosperity, but the rebellious dwell in a parched land.",
    ref: "Psalm 68:6",
  },
  confident: {
    text: "I can do all things through him who strengthens me.",
    ref: "Philippians 4:13",
  },
  convicted: {
    text: "If we confess our sins, he is faithful and just to forgive us our sins and to cleanse us from all unrighteousness.",
    ref: "1 John 1:9",
  },
  bored: {
    text: "Whatever you do, work heartily, as for the Lord and not for men.",
    ref: "Colossians 3:23",
  },
  stressed: {
    text: "Casting all your anxieties on him, because he cares for you.",
    ref: "1 Peter 5:7",
  },
  fear: {
    text: "For God gave us a spirit not of fear but of power and love and self-control.",
    ref: "2 Timothy 1:7",
  },
  rejection: {
    text: "Even as he chose us in him before the foundation of the world, that we should be holy and blameless before him. In love he predestined us for adoption to himself as sons through Jesus Christ, according to the purpose of his will.",
    ref: "Ephesians 1:4-5",
  },
};

// ========== COMPLETION OVERLAY ==========
const CompletionOverlay = ({ onDone }: { onDone: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80"
      onAnimationComplete={() => {
        setTimeout(() => onDone(), 1500);
      }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
        className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4"
      >
        <Check className="w-8 h-8 text-primary" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-white text-xl font-semibold text-center"
      >
        Complete
      </motion.p>
    </motion.div>
  );
};

// ========== COMPACT COMPLETED STATE ==========
interface CompactCompletedProps {
  feelings: string[];
  scripture: { text: string; ref: string } | null;
  onCheckInAgain: () => void;
}

const CompactCompleted = ({ feelings, scripture, onCheckInAgain }: CompactCompletedProps) => {
  return (
    <div className="bg-[#0A0A0A] rounded-2xl border-[1.5px] border-[#C9A84C] p-5 text-white shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
      {/* Header with checkmark */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Check className="w-4 h-4 text-primary" />
        </div>
        <h2 className="font-serif text-base font-bold text-white">Daily Check-In</h2>
      </div>

      {/* Emotion pills */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {feelings.map((f) => {
          const label = awarenessOptions.find((o) => o.id === f)?.label || f;
          return (
            <span
              key={f}
              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/15 text-primary border border-primary/30"
            >
              {label}
            </span>
          );
        })}
      </div>

      {/* Scripture */}
      {scripture && (
        <div className="bg-white/5 border border-primary/15 rounded-xl p-3 mb-3">
          <p className="font-serif text-xs text-white/80 italic leading-relaxed">
            "{scripture.text}"
          </p>
          <p className="text-[11px] text-primary mt-1 font-medium">{scripture.ref}</p>
        </div>
      )}

      {/* Check in again link */}
      <button
        onClick={onCheckInAgain}
        className="text-xs text-primary/70 hover:text-primary font-medium transition-colors"
      >
        Check in again
      </button>
    </div>
  );
};

// ========== ACTIVE CHECK-IN FORM ==========
interface DailyCheckInProps {
  onComplete: () => void;
  onNeedSupport: () => void;
  onSpiritPromptWritten?: () => void;
}

const DailyCheckIn = ({ onComplete, onNeedSupport, onSpiritPromptWritten }: DailyCheckInProps) => {
  const [step, setStep] = useState(0);
  const [selectedAwareness, setSelectedAwareness] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showBreathText, setShowBreathText] = useState(false);
  const [hasTypedSpirit, setHasTypedSpirit] = useState(false);
  const [redoMode, setRedoMode] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const spiritRef = useRef<HTMLTextAreaElement>(null);
  const { isCheckedIn, todayCheckIn, submitCheckIn } = useDailyCheckIn();

  // Randomize core and extra tiles independently once per session
  const shuffledCore = useMemo(() => {
    const arr = [...coreOptions];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, []);

  const shuffledExtra = useMemo(() => {
    const arr = [...extraOptions];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, []);

  const visibleOptions = showMore ? [...shuffledCore, ...shuffledExtra] : shuffledCore;

  // Get the most relevant scripture for selected emotions
  const activeScripture = useMemo(() => {
    return selectedAwareness ? scriptureResponses[selectedAwareness] ?? null : null;
  }, [selectedAwareness]);

  // Get scripture for the completed check-in data
  const completedScripture = useMemo(() => {
    if (!todayCheckIn?.feelings) return null;
    const feelings = todayCheckIn.feelings as string[];
    const prioritized = ["ashamed", "tempted", "anxious", "isolated", "discouraged", "tired"];
    for (const id of prioritized) {
      if (feelings.includes(id)) return scriptureResponses[id];
    }
    const last = feelings[feelings.length - 1];
    return last ? scriptureResponses[last] : null;
  }, [todayCheckIn]);

  // Show compact completed state if checked in and not redoing
  if (isCheckedIn && !showOverlay && !redoMode) {
    return (
      <CompactCompleted
        feelings={(todayCheckIn?.feelings as string[]) || []}
        scripture={completedScripture}
        onCheckInAgain={() => {
          setRedoMode(true);
          setStep(0);
          setSelectedAwareness(null);
          setHasTypedSpirit(false);
          setShowBreathText(false);
        }}
      />
    );
  }

  const toggleAwareness = (id: string) => {
    setSelectedAwareness((prev) => prev === id ? null : id);
  };

  const needsSupport = selectedAwareness
    ? ["anxious", "tempted", "isolated", "discouraged", "ashamed"].includes(selectedAwareness)
    : false;

  const handleSpiritInput = () => {
    const val = spiritRef.current?.value.trim() || "";
    setHasTypedSpirit(val.length > 0);
  };

  const handleComplete = async () => {
    const spiritText = spiritRef.current?.value.trim() || "";
    const hasSpirit = spiritText.length > 0;
    await submitCheckIn.mutateAsync({
      feelings: selectedAwareness ? [selectedAwareness] : [],
      needsSupport,
      spiritResponse: hasSpirit ? spiritText : undefined,
    });
    if (hasSpirit && onSpiritPromptWritten) onSpiritPromptWritten();
    setShowOverlay(true);
  };

  return (
    <>
      <div className="bg-[#0A0A0A] rounded-2xl border-[1.5px] border-[#C9A84C] p-6 pb-8 text-white shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
        <h2 className="font-serif text-[1.375rem] font-bold text-white text-center mb-3">Daily Check-In</h2>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="awareness"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <p className="text-sm text-white text-center mb-6">
                What is present in you right now?
              </p>
              <div className="grid grid-cols-2 gap-3 mb-2">
                {visibleOptions.map((option) => {
                  const isSelected = selectedAwareness === option.id;
                  return (
                    <motion.button
                      key={option.id}
                      onClick={() => toggleAwareness(option.id)}
                      animate={{ scale: isSelected ? 1.02 : 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className={cn(
                        "relative flex items-center justify-center p-3 rounded-xl transition-colors duration-150 text-center border-[1.5px] border-[#C9A84C]",
                        isSelected
                          ? "bg-[#C9A84C] text-[#0A0A0A] font-bold"
                          : "bg-[#1A1A1A] text-white"
                      )}
                    >
                      <span className="text-sm font-medium">{option.label}</span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#0A0A0A] ml-auto" />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {!showMore && (
                <button
                  onClick={() => setShowMore(true)}
                  className="text-xs text-primary/70 hover:text-primary font-medium transition-colors mb-4 block mx-auto"
                >
                  Show more
                </button>
              )}

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
                      <p className="font-serif text-sm text-white italic leading-relaxed">
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
                  className="text-sm text-white text-center mb-4"
                >
                  Awareness builds strength.
                </motion.p>
              )}

              {selectedAwareness && (
                <div className="flex gap-3">
                  <motion.div
                    className="flex-1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileTap={{ scale: 0.97, y: -1 }}
                  >
                    <Button
                      onClick={() => {
                        setShowBreathText(true);
                        setTimeout(() => setStep(1), 1000);
                      }}
                      className="w-full rounded-xl font-bold h-12 text-base bg-primary text-[#0A0A0A] hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-200"
                    >
                      I am aligned. Let's Go.
                    </Button>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="spirit-prompt"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <p className="text-white font-serif text-lg mb-4">
                What do you sense the Spirit saying about what you are feeling?
              </p>
              
              <textarea
                ref={spiritRef}
                defaultValue=""
                onBlur={handleSpiritInput}
                onInput={handleSpiritInput}
                placeholder="Write what comes to mind..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/90 placeholder:text-white/25 resize-none focus:outline-none focus:border-primary/50 transition-colors"
                rows={3}
              />

              <div className="flex flex-col gap-3 mt-4">
                <Button
                  onClick={handleComplete}
                  disabled={submitCheckIn.isPending || !hasTypedSpirit}
                  className={cn(
                    "w-full rounded-xl font-semibold h-12 text-base shadow-lg transition-all duration-200",
                    hasTypedSpirit
                      ? "bg-primary text-[#0A0A0A] hover:bg-primary/90 shadow-primary/20"
                      : "bg-[hsl(225_12%_10%)] text-muted-foreground border border-primary/30 shadow-none cursor-not-allowed"
                  )}
                >
                  <Check className="w-4 h-4" />
                  Complete Check-In
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Completion Overlay */}
      <AnimatePresence>
        {showOverlay && (
          <CompletionOverlay
            onDone={() => {
              setShowOverlay(false);
              setRedoMode(false);
              onComplete();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default DailyCheckIn;
