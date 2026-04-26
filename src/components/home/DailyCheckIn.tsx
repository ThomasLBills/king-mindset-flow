import { useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDailyCheckIn } from "@/hooks/useDailyProgress";

const sansFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

const coreOptions = [
  { id: "hopeful", label: "Hopeful" },
  { id: "tempted", label: "Tempted" },
  { id: "grateful", label: "Grateful" },
  { id: "anxious", label: "Anxious" },
];

const extraOptions = [
  { id: "calm", label: "Calm" },
  { id: "tired", label: "Tired" },
  { id: "discouraged", label: "Discouraged" },
  { id: "ashamed", label: "Ashamed" },
  { id: "peaceful", label: "Peaceful" },
  { id: "isolated", label: "Isolated" },
  { id: "connected", label: "Connected" },
  { id: "rested", label: "Rested" },
  { id: "overwhelmed", label: "Overwhelmed" },
  { id: "angry", label: "Angry" },
  { id: "lonely", label: "Lonely" },
  { id: "fear", label: "Fear" },
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
    text: "Know this, my beloved brothers: let every person be quick to hear, slow to speak, slow to anger; for the anger of man does not produce the righteousness of God.",
    ref: "James 1:19-20",
  },
  overwhelmed: {
    text: "God is our refuge and strength, a very present help in trouble.",
    ref: "Psalm 46:1",
  },
  lonely: {
    text: "God settles the solitary in a home; he leads out the prisoners to prosperity, but the rebellious dwell in a parched land.",
    ref: "Psalm 68:6",
  },
  fear: {
    text: "For God gave us a spirit not of fear but of power and love and self-control.",
    ref: "2 Timothy 1:7",
  },
};

const scripturePriority = ["angry", "ashamed", "tempted", "anxious", "isolated", "discouraged", "tired"];

const getScriptureForFeelings = (feelings?: string[] | null) => {
  if (!feelings?.length) return null;

  for (const id of scripturePriority) {
    if (feelings.includes(id) && scriptureResponses[id]) {
      return scriptureResponses[id];
    }
  }

  const mostRecentMappedFeeling = [...feelings].reverse().find((id) => scriptureResponses[id]);
  return mostRecentMappedFeeling ? scriptureResponses[mostRecentMappedFeeling] : null;
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
    <div className="dark-card-gradient rounded-[16px] text-white" style={{ fontFamily: sansFont, padding: "20px 20px 24px" }}>
      {/* Header — no checkmark, same as pre-check-in */}
      <h2 className="uppercase text-center mb-3" style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.12em", color: "#B8963F" }}>
        Daily Check-In
      </h2>

      {/* Emotion pills */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {feelings.map((f) => {
          const label = awarenessOptions.find((o) => o.id === f)?.label || f;
          return (
            <span
              key={f}
              className="inline-flex items-center rounded-[20px] cursor-default"
              style={{
                background: "rgba(184, 150, 63, 0.12)",
                color: "#B8963F",
                fontSize: "13px",
                fontWeight: 600,
                padding: "8px 16px",
                border: "none",
                outline: "none",
                boxShadow: "none",
              }}
            >
              {label}
            </span>
          );
        })}
      </div>

      {/* Scripture — left border accent */}
      {scripture && (
        <div style={{ borderLeft: "3px solid #B8963F", paddingLeft: "16px", paddingTop: "4px", paddingBottom: "4px", marginBottom: "4px" }}>
          <p
            style={{
              fontSize: "20px",
              fontWeight: 600,
              lineHeight: 1.5,
              color: "#F5F3EE",
              letterSpacing: "0.01em",
            }}
          >
            {scripture.text}
          </p>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "#B8963F", marginTop: "12px" }}>
            {scripture.ref}
          </p>
        </div>
      )}

      {/* Check in again link */}
      <button
        onClick={onCheckInAgain}
        className="transition-colors hover:opacity-80 mt-4 block"
        style={{ fontSize: "13px", fontWeight: 500, color: "#B8963F" }}
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

  // Extra options shuffled once per session; core options stay in fixed order
  const shuffledExtra = useMemo(() => {
    const arr = [...extraOptions];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, []);

  const visibleOptions = showMore ? [...coreOptions, ...shuffledExtra] : coreOptions;

  // Get the most relevant scripture for selected emotions
  const activeScripture = useMemo(() => {
    return getScriptureForFeelings(selectedAwareness ? [selectedAwareness] : undefined);
  }, [selectedAwareness]);

  // Get scripture for the completed check-in data
  const completedScripture = useMemo(() => {
    return getScriptureForFeelings((todayCheckIn?.feelings as string[] | undefined) ?? undefined);
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
          setShowMore(false);
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
      <div className="dark-card-gradient rounded-[16px] p-5 text-white" style={{ fontFamily: sansFont }}>
        <h2
          className="text-xs font-medium uppercase tracking-[0.06em] text-primary text-center mb-3"
        >
          Daily Check-In
        </h2>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="awareness"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <AnimatePresence mode="wait">
                {!selectedAwareness ? (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  >
                    <p className="text-sm text-left mb-6" style={{ fontWeight: 400, fontSize: "14px", color: "#F5F3EE" }}>
                      What is present in you right now?
                    </p>
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      {visibleOptions.map((option) => (
                        <motion.button
                          key={option.id}
                          onClick={() => toggleAwareness(option.id)}
                          whileTap={{ scale: 0.97 }}
                          className="relative flex items-center justify-center p-3 rounded-[10px] transition-colors duration-150 text-center"
                          style={{ background: "#242424", color: "rgba(255,255,255,0.8)", fontWeight: 400 }}
                        >
                          <span className="text-sm">{option.label}</span>
                        </motion.button>
                      ))}
                    </div>

                    <button
                      onClick={() => setShowMore((v) => !v)}
                      className="text-primary hover:text-primary/80 font-medium transition-colors mb-4 block mx-auto"
                      style={{ fontSize: "13px", textDecoration: "none" }}
                    >
                      {showMore ? "Show less" : "Show more"}
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="focused"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    className="flex flex-col items-center w-full"
                  >
                    <button
                      onClick={() => setSelectedAwareness(null)}
                      className="self-start text-xs text-primary/70 hover:text-primary font-medium transition-colors mb-4 touch-manipulation min-h-[32px] flex items-center"
                    >
                      ← Back
                    </button>

                    <span className="px-5 py-2 rounded-full text-base font-bold bg-primary text-[#0A0A0A] mb-5">
                      {awarenessOptions.find((o) => o.id === selectedAwareness)?.label}
                    </span>

                    {activeScripture && (
                      <div className="w-full bg-white/5 border border-primary/20 rounded-xl p-4 sm:p-5 mb-5">
                        <p className="text-sm sm:text-base text-white italic leading-relaxed break-words">
                          "{activeScripture.text}"
                        </p>
                        <p className="text-xs sm:text-sm text-primary mt-2 font-medium">{activeScripture.ref}</p>
                      </div>
                    )}

                    <Button
                      onClick={() => {
                        setShowBreathText(true);
                        setTimeout(() => setStep(1), 1000);
                      }}
                      className="w-full rounded-[10px] font-semibold h-12 text-base bg-primary text-[#0A0A0A] hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-200 touch-manipulation"
                    >
                      I am aligned. Let's Go.
                    </Button>

                    {showBreathText && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-white text-center mt-3"
                      >
                        Awareness builds strength.
                      </motion.p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="spirit-prompt"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <p className="text-white text-lg mb-4" style={{ fontFamily: sansFont }}>
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
                    "w-full rounded-[10px] font-semibold h-12 text-base shadow-lg transition-all duration-200",
                    hasTypedSpirit
                      ? "bg-primary text-[#0A0A0A] hover:bg-primary/90 shadow-primary/20"
                      : "bg-[hsl(225_12%_10%)] text-muted-foreground border border-primary/30 shadow-none cursor-not-allowed"
                  )}
                >
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
              setShowMore(false);
              setSelectedAwareness(null);
              onComplete();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default DailyCheckIn;
