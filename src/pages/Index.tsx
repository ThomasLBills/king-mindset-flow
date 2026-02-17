import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import DailyCheckIn from "@/components/home/DailyCheckIn";
import ToolCard from "@/components/home/ToolCard";
import WeekProgress from "@/components/home/WeekProgress";
import FreedomCalendar from "@/components/home/FreedomCalendar";
import PressureRisingTool from "@/components/tools/PressureRisingTool";
import TemptationTool from "@/components/tools/TemptationTool";
import AfterFallTool from "@/components/tools/AfterFallTool";
import ReachOut from "@/components/brotherhood/ReachOut";
import { Flame, Shield, Heart } from "lucide-react";
import { useDailyCheckIn, useFreedomStreak } from "@/hooks/useDailyProgress";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";


const Index = () => {
  const [showPressure, setShowPressure] = useState(false);
  const [showTemptation, setShowTemptation] = useState(false);
  const [showGrace, setShowGrace] = useState(false);
  const [showReachOut, setShowReachOut] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const { user } = useAuth();
  const { isCheckedIn } = useDailyCheckIn();
  const { daysFree } = useFreedomStreak();

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

  return (
    <AppLayout>
      <div className="px-6 py-6 max-w-lg mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <p className="text-sm text-muted-foreground tracking-wide mb-1">
            {daysFree > 0 ? `Day ${daysFree} of your journey` : "Start steady."}
          </p>
          <h1 className="font-serif text-4xl font-semibold">{timeGreeting}, {firstName}.</h1>
        </motion.div>

        {/* Daily Check-In */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-5">
          {!checkInDone ? (
            <DailyCheckIn
              onComplete={() => setJustCompleted(true)}
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

        {/* Freedom Calendar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-5">
          <FreedomCalendar onOpenGraceProtocol={() => setShowGrace(true)} />
        </motion.div>

        {/* Week Progress */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-5">
          <WeekProgress />
        </motion.div>

        {/* In-the-Moment Tools */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="font-serif text-2xl font-semibold mb-4">In-the-Moment Tools</h2>
          <div className="space-y-4">
            <ToolCard title="Pressure Rising" description="Notice → Name Truth → Redirect" icon={Flame} variant="pressure" onClick={() => setShowPressure(true)} />
            <ToolCard title="Active Temptation" description="The way out when you need it now" icon={Shield} variant="temptation" onClick={() => setShowTemptation(true)} />
            <ToolCard title="After a Fall" description="Grace Protocol: Return quickly" icon={Heart} variant="grace" onClick={() => setShowGrace(true)} />
          </div>
        </motion.div>

        {/* Scripture Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-6">
          <div className="scripture-card">
            <p className="font-serif text-lg text-white/90 leading-relaxed mb-3">
              "Therefore, there is now no condemnation for those who are in Christ Jesus."
            </p>
            <p className="text-sm text-white/60">Romans 8:1</p>
          </div>
        </motion.div>
      </div>

      {/* Tool Modals */}
      <AnimatePresence>
        {showPressure && (
          <PressureRisingTool onClose={() => setShowPressure(false)} onReachOut={() => { setShowPressure(false); setShowReachOut(true); }} />
        )}
        {showTemptation && (
          <TemptationTool onClose={() => setShowTemptation(false)} onReachOut={() => { setShowTemptation(false); setShowReachOut(true); }} />
        )}
        {showGrace && (
          <AfterFallTool onClose={() => setShowGrace(false)} onReachOut={() => { setShowGrace(false); setShowReachOut(true); }} />
        )}
        {showReachOut && <ReachOut onClose={() => setShowReachOut(false)} />}
      </AnimatePresence>
    </AppLayout>
  );
};

export default Index;
