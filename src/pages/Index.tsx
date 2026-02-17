import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import DailyCheckIn from "@/components/home/DailyCheckIn";
import KingProfile from "@/components/home/KingProfile";
import FreedomStrip from "@/components/home/FreedomStrip";
import PatternInsightCard from "@/components/home/PatternInsightCard";
import AfterFallTool from "@/components/tools/AfterFallTool";
import ReachOut from "@/components/brotherhood/ReachOut";
import { Heart } from "lucide-react";
import { useDailyCheckIn, useFreedomStreak } from "@/hooks/useDailyProgress";
import { useTriggerPatterns } from "@/hooks/useTriggerPatterns";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [showGrace, setShowGrace] = useState(false);
  const [showReachOut, setShowReachOut] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const { user } = useAuth();
  const { isCheckedIn } = useDailyCheckIn();
  const { daysFree } = useFreedomStreak();
  const { activeInsight, dismissInsight, analyzePatterns } = useTriggerPatterns();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("first_name, display_name")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const firstName = profile?.first_name || profile?.display_name || "King";
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const checkInDone = isCheckedIn || justCompleted;

  // Show insight only when check-in is done and there is an active insight
  const showInsight = checkInDone && activeInsight && !activeInsight.dismissed;

  return (
    <AppLayout>
      <div className="px-6 py-6 max-w-lg mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="font-serif text-4xl font-semibold mb-1">{timeGreeting}, {firstName}.</h1>
          <p className="text-sm text-muted-foreground">
            {daysFree > 0
              ? `You are on Day ${daysFree} of your liberation.`
              : "Today is a new beginning. Walk in freedom."}
          </p>
        </motion.div>

        {/* 1. Daily Check-In */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-5">
          {!checkInDone ? (
            <DailyCheckIn
              onComplete={() => {
                setJustCompleted(true);
                analyzePatterns.mutate();
              }}
              onNeedSupport={() => setShowReachOut(true)}
            />
          ) : (
            <div className="card-elevated p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center">
                  <Heart className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="font-medium">Check-in complete</p>
                  <p className="text-sm text-muted-foreground">Walking in awareness today</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* 2. King Profile */}
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

        {/* 3. Freedom Journey (compact strip) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-5">
          <FreedomStrip onOpenGraceProtocol={() => setShowGrace(true)} />
        </motion.div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showGrace && (
          <AfterFallTool onClose={() => setShowGrace(false)} onReachOut={() => { setShowGrace(false); setShowReachOut(true); }} />
        )}
        {showReachOut && <ReachOut onClose={() => setShowReachOut(false)} />}
      </AnimatePresence>
    </AppLayout>
  );
};

export default Index;
