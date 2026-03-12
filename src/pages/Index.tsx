import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import DailyCheckIn from "@/components/home/DailyCheckIn";
import FreedomStrip from "@/components/home/FreedomStrip";
import UrgesRedirectedCard from "@/components/home/UrgesRedirectedCard";
import PatternInsightCard from "@/components/home/PatternInsightCard";
import ReachOut from "@/components/brotherhood/ReachOut";
import { useDailyCheckIn } from "@/hooks/useDailyProgress";
import { useTriggerPatterns } from "@/hooks/useTriggerPatterns";
import { useAuth } from "@/hooks/useAuth";
import { useEvidenceCounter } from "@/hooks/useEvidenceCounter";

const Index = () => {
  const [showReachOut, setShowReachOut] = useState(false);

  const { user } = useAuth();
  const { isCheckedIn } = useDailyCheckIn();
  const { activeInsight, dismissInsight, analyzePatterns } = useTriggerPatterns();
  const { addEvidence } = useEvidenceCounter();

  const showInsight = isCheckedIn && activeInsight && !activeInsight.dismissed;

  return (
    <AppLayout>
      <div className="px-6 py-6 max-w-lg mx-auto">
        {/* Personalized Greeting */}
        <div className="py-6 mb-5">
          <h1 className="font-serif text-[22px] font-semibold text-[#1A1A1A]">
            {(() => {
              const h = new Date().getHours();
              const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
              const firstName = user?.user_metadata?.name?.split(" ")[0] || user?.user_metadata?.first_name || "King";
              return `${greeting}, ${firstName}.`;
            })()}
          </h1>
          <p className="font-serif text-[15px] text-[#555555] mt-1">
            Walk in who you already are.
          </p>
        </div>

        {/* 1. Daily Check-In */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-5">
          <DailyCheckIn
            onComplete={() => {
              analyzePatterns.mutate();
              addEvidence.mutate("check_in");
            }}
            onSpiritPromptWritten={() => {
              addEvidence.mutate("spirit_prompt");
            }}
            onNeedSupport={() => setShowReachOut(true)}
          />
        </motion.div>

        {/* 2. Urges Redirected */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-5">
          <UrgesRedirectedCard />
        </motion.div>

        {/* 3. Liberation */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-5">
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

        {/* TEMP DEMO — remove after review */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <PatternInsightCard
            title="Pattern Detected: Isolation Before Relapse"
            message="Over the past 3 weeks, you've checked in feeling 'Isolated' 4 times — and 3 of those were within 48 hours of a fall. Isolation may be a key trigger for you."
            scriptureRef="Hebrews 10:24-25"
            scriptureText="And let us consider how to stir up one another to love and good works, not neglecting to meet together, as is the habit of some, but encouraging one another."
            actionStep="Reach out to a brother next time you feel isolated — before it escalates."
            onDismiss={() => {}}
          />
        </motion.div>

      </div>

      {/* Modals */}
      <AnimatePresence>
        {showReachOut && <ReachOut onClose={() => setShowReachOut(false)} />}
      </AnimatePresence>
    </AppLayout>
  );
};

export default Index;
