import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import ToolCard from "@/components/home/ToolCard";
import PressureRisingTool from "@/components/tools/PressureRisingTool";
import TemptationTool from "@/components/tools/TemptationTool";
import GraceProtocol from "@/components/tools/GraceProtocol";
import ReachOut from "@/components/brotherhood/ReachOut";
import { Flame, Shield, Heart, Users } from "lucide-react";

const ToolsPage = () => {
  const [showPressure, setShowPressure] = useState(false);
  const [showTemptation, setShowTemptation] = useState(false);
  const [showGraceProtocol, setShowGraceProtocol] = useState(false);
  const [showReachOut, setShowReachOut] = useState(false);

  return (
    <AppLayout>
      <div className="px-5 py-6 min-h-screen bg-[hsl(225_12%_6%)]">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="font-serif text-3xl font-bold text-white mb-2">Your Armor</h1>
          <p className="text-white/50">
            Put on the full armor of God. Choose what your moment requires.
          </p>
        </motion.div>

        {/* Armor Cards */}
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
            onClick={() => setShowPressure(true)}
          />
          <ToolCard
            title="Active Temptation"
            description="The way out when you need it now"
            icon={Shield}
            onClick={() => setShowTemptation(true)}
          />
          <ToolCard
            title="After a Fall"
            description="Grace Protocol. Return quickly."
            icon={Heart}
            onClick={() => setShowGraceProtocol(true)}
          />
        </motion.div>

        {/* Reach Out Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <button
            onClick={() => setShowReachOut(true)}
            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200"
          >
            <div className="flex items-center justify-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-semibold text-white">Reach Out Now</span>
            </div>
            <p className="text-sm text-white/40 mt-1">
              Connect with a brother immediately
            </p>
          </button>
        </motion.div>

        {/* Scripture */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-white/5 border border-primary/20 rounded-xl p-5">
            <p className="font-serif text-sm text-white/80 italic leading-relaxed mb-2">
              "No temptation has overtaken you except what is common to mankind. And God is faithful; he will not let you be tempted beyond what you can bear."
            </p>
            <p className="text-xs text-primary">1 Corinthians 10:13</p>
          </div>
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
        {showReachOut && <ReachOut onClose={() => setShowReachOut(false)} />}
        {showGraceProtocol && <GraceProtocol onClose={() => setShowGraceProtocol(false)} />}
      </AnimatePresence>
    </AppLayout>
  );
};

export default ToolsPage;
