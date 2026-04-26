import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import FreedomStrip from "@/components/home/FreedomStrip";
import UrgesRedirectedCard from "@/components/home/UrgesRedirectedCard";
import ArmorActivatedCard from "@/components/home/ArmorActivatedCard";
import ReachOut from "@/components/brotherhood/ReachOut";
import YourPathToday from "@/components/home/YourPathToday";
import { useAuth } from "@/hooks/useAuth";
import { useEvidenceCounter } from "@/hooks/useEvidenceCounter";

const Index = () => {
  const [showReachOut, setShowReachOut] = useState(false);

  const { user } = useAuth();
  const { addEvidence } = useEvidenceCounter();

  return (
    <AppLayout>
      <div
        className="px-4 max-w-lg mx-auto flex flex-col gap-7"
        style={{
          paddingTop: "max(env(safe-area-inset-top), 24px)",
          paddingBottom: "32px",
        }}
      >
        {/* Personalized Greeting */}
        <div className="pt-2 pb-1">
          <span
            className="greeting-sans block text-[22px] text-[#1A1A1A]"
            style={{ fontWeight: 600, letterSpacing: "-0.02em" }}
          >
            {(() => {
              const h = new Date().getHours();
              const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
              const firstName = user?.user_metadata?.name?.split(" ")[0] || user?.user_metadata?.first_name || "King";
              return `${greeting}, ${firstName}.`;
            })()}
          </span>
          <p
            className="text-[15px] mt-1"
            style={{
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
              fontWeight: 400,
              color: "rgba(26, 26, 26, 0.6)",
            }}
          >
            Walk in who you already are.
          </p>
        </div>

        {/* 1. Your Path Today (Primary) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <YourPathToday
            onCheckInComplete={() => {
              addEvidence.mutate("check_in");
            }}
            onSpiritPromptWritten={() => {}}
            onNeedSupport={() => setShowReachOut(true)}
          />
        </motion.div>

        {/* 2. Urges Redirected */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <UrgesRedirectedCard />
        </motion.div>

        {/* 3. This Week's Evidence */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="grid grid-cols-2 gap-[10px] items-stretch">
            <ArmorActivatedCard />
            <FreedomStrip />
          </div>
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
