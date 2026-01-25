import { useState } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import ToolCard from "@/components/home/ToolCard";
import PressureRisingTool from "@/components/tools/PressureRisingTool";
import TemptationTool from "@/components/tools/TemptationTool";
import AfterFallTool from "@/components/tools/AfterFallTool";
import ReachOut from "@/components/brotherhood/ReachOut";
import { Flame, Shield, Heart, Zap, Moon, Users } from "lucide-react";
import { AnimatePresence } from "framer-motion";

const quickCards = [
  { id: "fatigue", label: "I'm tired", icon: Moon, color: "bg-primary/10 text-primary" },
  { id: "lonely", label: "I'm lonely", icon: Users, color: "bg-accent/10 text-accent" },
  { id: "stressed", label: "I'm stressed", icon: Zap, color: "bg-warning/10 text-warning" },
];

const ToolsPage = () => {
  const [showPressure, setShowPressure] = useState(false);
  const [showTemptation, setShowTemptation] = useState(false);
  const [showGrace, setShowGrace] = useState(false);
  const [showReachOut, setShowReachOut] = useState(false);

  return (
    <AppLayout>
      <div className="px-5 py-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="font-serif text-3xl font-bold mb-2">Your Tools</h1>
          <p className="text-muted-foreground">
            Choose the tool that matches your moment
          </p>
        </motion.div>

        {/* Main Tools */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3 mb-8"
        >
          <ToolCard
            title="Pressure Rising"
            description="Notice → Name Truth → Redirect"
            icon={Flame}
            variant="pressure"
            onClick={() => setShowPressure(true)}
          />
          <ToolCard
            title="Active Temptation"
            description="The way out when you need it now"
            icon={Shield}
            variant="temptation"
            onClick={() => setShowTemptation(true)}
          />
          <ToolCard
            title="After a Fall"
            description="Grace Protocol: Return quickly"
            icon={Heart}
            variant="grace"
            onClick={() => setShowGrace(true)}
          />
        </motion.div>

        {/* Quick Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-serif text-xl font-semibold mb-4">Quick Help</h2>
          <div className="grid grid-cols-3 gap-3">
            {quickCards.map((card) => (
              <button
                key={card.id}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all"
              >
                <div className={`p-2.5 rounded-xl ${card.color}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-center">{card.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Emergency Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <button
            onClick={() => setShowReachOut(true)}
            className="w-full p-4 rounded-xl bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-all"
          >
            <div className="flex items-center justify-center gap-3">
              <Users className="w-5 h-5 text-accent" />
              <span className="font-semibold text-accent">Reach Out Now</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Connect with a brother immediately
            </p>
          </button>
        </motion.div>
      </div>

      {/* Tool Modals */}
      <AnimatePresence>
        {showPressure && (
          <PressureRisingTool
            onClose={() => setShowPressure(false)}
            onReachOut={() => {
              setShowPressure(false);
              setShowReachOut(true);
            }}
          />
        )}
        {showTemptation && (
          <TemptationTool
            onClose={() => setShowTemptation(false)}
            onReachOut={() => {
              setShowTemptation(false);
              setShowReachOut(true);
            }}
          />
        )}
        {showGrace && (
          <AfterFallTool
            onClose={() => setShowGrace(false)}
            onReachOut={() => {
              setShowGrace(false);
              setShowReachOut(true);
            }}
          />
        )}
        {showReachOut && <ReachOut onClose={() => setShowReachOut(false)} />}
      </AnimatePresence>
    </AppLayout>
  );
};

export default ToolsPage;
