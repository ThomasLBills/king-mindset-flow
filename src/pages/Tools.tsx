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
      <div className="px-5 py-6 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="font-serif text-3xl font-bold mb-2">Your Armor</h1>
          <p className="text-muted-foreground">
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
            className="w-full text-left p-4 rounded-2xl bg-[#111111] border-l-4 border-primary transition-all hover:border-primary/80"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-white">Reach Out Now</h3>
                <p className="text-sm text-white">Connect with a brother immediately</p>
              </div>
            </div>
          </button>
        </motion.div>

        {/* Scripture */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="w-full rounded-2xl bg-[#111111] px-6 py-8">
            <p className="font-serif text-base text-white italic leading-relaxed mb-3">
              "No temptation has overtaken you except what is common to mankind. And God is faithful; he will not let you be tempted beyond what you can bear."
            </p>
            <p className="text-sm text-primary font-medium">1 Corinthians 10:13</p>
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
