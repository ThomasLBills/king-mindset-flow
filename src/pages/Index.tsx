import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import DailyCheckIn from "@/components/home/DailyCheckIn";
import FreedomStrip from "@/components/home/FreedomStrip";
import PatternInsightCard from "@/components/home/PatternInsightCard";
import ReachOut from "@/components/brotherhood/ReachOut";
import { useDailyCheckIn } from "@/hooks/useDailyProgress";
import { useTriggerPatterns } from "@/hooks/useTriggerPatterns";
import { useAuth } from "@/hooks/useAuth";
import { useEvidenceCounter } from "@/hooks/useEvidenceCounter";

const Index = () => {
  const [showReachOut, setShowReachOut] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const { user } = useAuth();
  const { isCheckedIn } = useDailyCheckIn();
  const { activeInsight, dismissInsight, analyzePatterns } = useTriggerPatterns();
  const { addEvidence } = useEvidenceCounter();

  const checkInDone = isCheckedIn || justCompleted;
  const showInsight = checkInDone && activeInsight && !activeInsight.dismissed;

  return (
    <AppLayout>
      <div className="px-6 py-6 max-w-lg mx-auto">
        {/* 1. Daily Check-In */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-5">
          <DailyCheckIn
            onComplete={() => {
              setJustCompleted(true);
              analyzePatterns.mutate();
              addEvidence.mutate("check_in");
            }}
            onSpiritPromptWritten={() => {
              addEvidence.mutate("spirit_prompt");
            }}
            onNeedSupport={() => setShowReachOut(true)}
          />
        </motion.div>

        {/* 2. Liberation */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-5">
          <FreedomStrip />
        </motion.div>

        {/* Pattern Insight Card */}
        <AnimatePresence>
          {showInsight && activeInsight && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-5">
              <PatternInsightCard
                title={activeInsight.title}
                message={activeInsight.message}
                scriptureRef={activeInsight.scripture_reference}
                scriptureText={activeInsight.scripture_text}
                actionStep={activeInsight.action_step}
                onDismiss={() => dismissInsight.mutate(activeInsight.id)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showReachOut && <ReachOut onClose={() => setShowReachOut(false)} />}
      </AnimatePresence>
    </AppLayout>
  );
};

export default Index;
