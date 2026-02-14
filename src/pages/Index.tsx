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
import { Flame, Shield, Heart, Sparkles } from "lucide-react";
import { useDailyCheckIn, useFreedomStreak } from "@/hooks/useDailyProgress";
import { useAuth } from "@/hooks/useAuth";

const greetings = [
  "Good morning, king.",
  "Welcome back, brother.",
  "You are seen.",
  "Grace meets you here.",
];

const Index = () => {
  const [showPressure, setShowPressure] = useState(false);
  const [showTemptation, setShowTemptation] = useState(false);
  const [showGrace, setShowGrace] = useState(false);
  const [showReachOut, setShowReachOut] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const { user } = useAuth();
  const { isCheckedIn } = useDailyCheckIn();
  const { daysFree } = useFreedomStreak();

  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  const checkInDone = isCheckedIn || justCompleted;

  return (
    <AppLayout>
      <div className="px-5 py-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm text-muted-foreground">
              {daysFree > 0 ? `Day ${daysFree} of your journey` : "Today is a new beginning"}
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold">{greeting}</h1>
        </motion.div>

        {/* Daily Check-In */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6">
          <FreedomCalendar onOpenGraceProtocol={() => setShowGrace(true)} />
        </motion.div>

        {/* Week Progress */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
          <WeekProgress />
        </motion.div>

        {/* In-the-Moment Tools */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="font-serif text-xl font-semibold mb-4">In-the-Moment Tools</h2>
          <div className="space-y-3">
            <ToolCard title="Pressure Rising" description="Notice → Name Truth → Redirect" icon={Flame} variant="pressure" onClick={() => setShowPressure(true)} />
            <ToolCard title="Active Temptation" description="The way out when you need it now" icon={Shield} variant="temptation" onClick={() => setShowTemptation(true)} />
            <ToolCard title="After a Fall" description="Grace Protocol: Return quickly" icon={Heart} variant="grace" onClick={() => setShowGrace(true)} />
          </div>
        </motion.div>

        {/* Scripture Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-6">
          <div className="scripture-card">
            <p className="font-serif text-lg text-primary-foreground/90 leading-relaxed mb-3">
              "Therefore, there is now no condemnation for those who are in Christ Jesus."
            </p>
            <p className="text-sm text-primary-foreground/60">Romans 8:1</p>
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
