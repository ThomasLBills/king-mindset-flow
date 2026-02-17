import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import DailyCheckIn from "@/components/home/DailyCheckIn";
import KingProfile from "@/components/home/KingProfile";
import FreedomStrip from "@/components/home/FreedomStrip";
import PatternInsightCard from "@/components/home/PatternInsightCard";
import GraceProtocol from "@/components/tools/GraceProtocol";
import ReachOut from "@/components/brotherhood/ReachOut";
import { useDailyCheckIn, useFreedomStreak } from "@/hooks/useDailyProgress";
import { useTriggerPatterns } from "@/hooks/useTriggerPatterns";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const [showGrace, setShowGrace] = useState(false);
  const [showReachOut, setShowReachOut] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const { user } = useAuth();
  const { isCheckedIn } = useDailyCheckIn();
  const { activeInsight, dismissInsight, analyzePatterns } = useTriggerPatterns();

  const checkInDone = isCheckedIn || justCompleted;
  const showInsight = checkInDone && activeInsight && !activeInsight.dismissed;

  return (
    <AppLayout>
      <div className="px-6 py-6 max-w-lg mx-auto">
        {/* 1. Freedom Journey */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-5">
          <FreedomStrip onOpenGraceProtocol={() => setShowGrace(true)} />
        </motion.div>

        {/* 2. Daily Check-In */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-5">
          <DailyCheckIn
            onComplete={() => {
              setJustCompleted(true);
              analyzePatterns.mutate();
            }}
            onNeedSupport={() => setShowReachOut(true)}
          />
        </motion.div>

        {/* 3. King Profile */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-5">
          <KingProfile />
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
        {showGrace && <GraceProtocol onClose={() => setShowGrace(false)} />}
        {showReachOut && <ReachOut onClose={() => setShowReachOut(false)} />}
      </AnimatePresence>
    </AppLayout>
  );
};

export default Index;
