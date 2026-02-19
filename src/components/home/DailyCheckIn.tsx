import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDailyCheckIn } from "@/hooks/useDailyProgress";

const awarenessOptions = [
  { id: "grateful", label: "Grateful" },
  { id: "calm", label: "Calm" },
  { id: "hopeful", label: "Hopeful" },
  { id: "connected", label: "Connected" },
  { id: "anxious", label: "Anxious" },
  { id: "tempted", label: "Tempted" },
  { id: "ashamed", label: "Ashamed" },
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

// ========== COMPLETION OVERLAY ==========
const CompletionOverlay = ({ onDone }: { onDone: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
      style={{ boxShadow: "inset 0 0 120px rgba(212,175,55,0.06)" }}
      onAnimationComplete={() => {
        setTimeout(() => onDone(), 1500);
      }}
    >
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="font-serif text-3xl font-bold text-white mb-3 text-center"
      >
        Your check-in is complete.
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-white text-lg text-center"
      >
        Walk in freedom today.
      </motion.p>
    </motion.div>
  );
};

// ========== COLLAPSED COMPLETED CARD ==========
interface CollapsedCheckInProps {
  checkInData: {
    feelings: string[];
    spirit_response: string | null;
  };
}

const CollapsedCheckIn = ({ checkInData }: CollapsedCheckInProps) => {
  const [expanded, setExpanded] = useState(false);

  const activeScripture = useMemo(() => {
    const prioritized = ["ashamed", "tempted", "anxious"];
    for (const id of prioritized) {
      if (checkInData.feelings.includes(id)) return scriptureResponses[id];
    }
    const last = checkInData.feelings[checkInData.feelings.length - 1];
    return last ? scriptureResponses[last] : null;
  }, [checkInData.feelings]);

  return (
    <div className="rounded-2xl bg-[#111111] border-l-4 border-l-primary overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
          <Check className="w-5 h-5 text-primary" />
        </div>
        <p className="font-serif text-base font-bold text-white flex-1">Today's Check-In Complete</p>
        <span className="text-sm text-primary font-medium">
          {expanded ? "Close" : "View"}
        </span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 space-y-4">
              <div>
                <p className="text-xs text-white/50 mb-2">How you were feeling</p>
                <div className="flex flex-wrap gap-2">
                  {checkInData.feelings.map((f) => {
                    const label = awarenessOptions.find((o) => o.id === f)?.label || f;
                    return (
                      <span
                        key={f}
                        className="px-3 py-1 rounded-full text-xs font-medium text-white border border-primary/40 bg-transparent"
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>

              {activeScripture && (
                <div>
                  <p className="text-xs text-white/50 mb-2">Scripture</p>
                  <div className="bg-white/5 border border-primary/20 rounded-xl p-3">
                    <p className="font-serif text-sm text-white leading-relaxed">
                      "{activeScripture.text}"
                    </p>
                    <p className="text-xs text-primary mt-1.5 font-medium">{activeScripture.ref}</p>
                  </div>
                </div>
              )}

              {checkInData.spirit_response && (
                <div>
                  <p className="text-xs text-white/50 mb-2">What the Spirit said</p>
                  <p className="text-sm text-white leading-relaxed">{checkInData.spirit_response}</p>
                </div>
              )}

              <p className="text-xs text-white/50 text-center pt-1">
                Check-in is locked until tomorrow. Come back tomorrow morning, King.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
  const [selectedAwareness, setSelectedAwareness] = useState<string[]>([]);
  const [showOverlay, setShowOverlay] = useState(false);
  const [spiritPrompt, setSpiritPrompt] = useState("");
  const { isCheckedIn, todayCheckIn, submitCheckIn } = useDailyCheckIn();

  const activeScripture = useMemo(() => {
    const prioritized = ["ashamed", "tempted", "anxious"];
    for (const id of prioritized) {
      if (selectedAwareness.includes(id)) return scriptureResponses[id];
    }
    const last = selectedAwareness[selectedAwareness.length - 1];
    return last ? scriptureResponses[last] : null;
  }, [selectedAwareness]);

  if (isCheckedIn && todayCheckIn) {
    return (
      <CollapsedCheckIn
        checkInData={{
          feelings: todayCheckIn.feelings || [],
          spirit_response: todayCheckIn.spirit_response,
        }}
      />
    );
  }

  const toggleAwareness = (id: string) => {
    setSelectedAwareness((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const needsSupport = selectedAwareness.some((a) =>
    ["anxious", "tempted", "ashamed"].includes(a)
  );

  const canComplete = selectedAwareness.length > 0 && spiritPrompt.trim().length > 0;

  const handleComplete = async () => {
    const hasSpirit = spiritPrompt.trim().length > 0;
    await submitCheckIn.mutateAsync({
      feelings: selectedAwareness,
      needsSupport,
      spiritResponse: hasSpirit ? spiritPrompt.trim() : undefined,
    });
    if (hasSpirit && onSpiritPromptWritten) onSpiritPromptWritten();
    setShowOverlay(true);
  };

  return (
    <>
      <div className="rounded-2xl bg-[#111111] border-l-4 border-l-primary p-6 text-white">
        {/* Heading */}
        <h2 className="font-serif text-xl font-bold text-white text-center mb-2">
          Daily Check-In
        </h2>

        {/* Theological statement */}
        <p className="text-sm text-white text-center mb-6">
          You are a son, not a slave. Name what's present without judgment.
        </p>

        {/* Emotions heading */}
        <p className="text-sm text-white font-medium mb-1">
          What is present in you right now?
        </p>
        <p className="text-xs text-white mb-4">Select all that apply.</p>

        {/* Emotion buttons - 2 columns */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {awarenessOptions.map((option) => {
            const isSelected = selectedAwareness.includes(option.id);
            return (
              <motion.button
                key={option.id}
                onClick={() => toggleAwareness(option.id)}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "flex items-center justify-center py-4 px-6 rounded-lg text-sm font-medium transition-colors",
                  isSelected
                    ? "bg-primary text-[#0A0A0A] font-bold"
                    : "bg-[#1C1C1E] border border-primary/30 text-white"
                )}
              >
                {option.label}
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
              className="mb-6 overflow-hidden"
            >
              <div className="bg-white/5 border border-primary/20 rounded-xl p-4">
                <p className="font-serif text-sm text-white leading-relaxed">
                  "{activeScripture.text}"
                </p>
                <p className="text-xs text-primary mt-2 font-medium">{activeScripture.ref}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scripture anchor */}
        <div className="text-center mb-6">
          <p className="text-sm text-white">The Spirit helps us in our weakness.</p>
          <p className="text-sm text-primary font-medium mt-1">Romans 8:26</p>
        </div>

        {/* Spirit prompt */}
        <p className="text-sm text-primary font-medium mb-3">
          What is the Spirit prompting you toward today?
        </p>
        <textarea
          value={spiritPrompt}
          onChange={(e) => setSpiritPrompt(e.target.value)}
          className="w-full bg-white/5 border border-primary/30 rounded-xl p-4 text-sm text-white resize-none focus:outline-none focus:border-primary/50 transition-colors mb-6"
          rows={4}
        />

        {/* Complete button */}
        <Button
          onClick={handleComplete}
          disabled={!canComplete || submitCheckIn.isPending}
          className={cn(
            "w-full rounded-xl font-bold h-12 text-base transition-colors",
            canComplete
              ? "bg-primary text-[#0A0A0A] hover:bg-primary/90"
              : "bg-[#1C1C1E] border border-primary/30 text-white/50 cursor-not-allowed"
          )}
        >
          Complete Check-In
        </Button>

        {/* Support button */}
        {needsSupport && selectedAwareness.length > 0 && (
          <Button
            onClick={onNeedSupport}
            className="w-full rounded-xl font-medium h-11 bg-white/10 text-white hover:bg-white/15 border border-white/10 mt-3"
          >
            <Heart className="w-4 h-4" />
            I need support today
          </Button>
        )}
      </div>

      <AnimatePresence>
        {showOverlay && (
          <CompletionOverlay
            onDone={() => {
              setShowOverlay(false);
              onComplete();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default DailyCheckIn;
