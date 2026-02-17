import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import PressureRisingTool from "@/components/tools/PressureRisingTool";
import TemptationTool from "@/components/tools/TemptationTool";
import GraceProtocol from "@/components/tools/GraceProtocol";

const armorScriptures = [
  {
    text: "No temptation has overtaken you except what is common to mankind. And God is faithful; he will not let you be tempted beyond what you can bear.",
    reference: "1 Corinthians 10:13",
  },
  {
    text: "Submit yourselves, then, to God. Resist the devil, and he will flee from you.",
    reference: "James 4:7",
  },
  {
    text: "The name of the Lord is a fortified tower; the righteous run to it and are safe.",
    reference: "Proverbs 18:10",
  },
  {
    text: "Put on the full armor of God, so that you can take your stand against the devil's schemes.",
    reference: "Ephesians 6:11",
  },
  {
    text: "Be alert and of sober mind. Your enemy the devil prowls around like a roaring lion looking for someone to devour.",
    reference: "1 Peter 5:8",
  },
  {
    text: "For God has not given us a spirit of fear, but of power and of love and of a sound mind.",
    reference: "2 Timothy 1:7",
  },
];

const STORAGE_KEY = "armor-scripture-index";

const getNextScriptureIndex = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const current = stored !== null ? parseInt(stored, 10) : -1;
  const next = (current + 1) % armorScriptures.length;
  localStorage.setItem(STORAGE_KEY, String(next));
  return next;
};

const ToolsPage = () => {
  const [showPressure, setShowPressure] = useState(false);
  const [showTemptation, setShowTemptation] = useState(false);
  const [showGraceProtocol, setShowGraceProtocol] = useState(false);

  const scripture = useMemo(() => armorScriptures[getNextScriptureIndex()], []);

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

        {/* Moment Selector Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="my-8"
        >
          <h2 className="font-semibold text-base mb-4">Which moment are you in?</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            {[
              { label: "Pressure Rising", action: () => setShowPressure(true) },
              { label: "Tempted Now", action: () => setShowTemptation(true) },
              { label: "After a Fall", action: () => setShowGraceProtocol(true) },
            ].map((item) => (
              <motion.button
                key={item.label}
                onClick={item.action}
                whileTap={{ scale: 1.02 }}
                className="flex-1 py-4 px-8 rounded-xl font-semibold text-white bg-[#1C1C1E] border-[1.5px] border-primary active:bg-primary active:text-[#0A0A0A] transition-colors duration-200"
              >
                {item.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Foundational Scripture */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="w-full rounded-2xl bg-[#111111] px-6 py-[60px] text-center shadow-[inset_0_0_40px_rgba(212,175,55,0.04)]">
            <p className="font-serif text-lg text-white italic leading-relaxed mb-4 max-w-md mx-auto">
              "{scripture.text}"
            </p>
            <p className="text-sm text-primary font-medium">{scripture.reference}</p>
          </div>
        </motion.div>
      </div>

      {/* Tool Modals */}
      <AnimatePresence>
        {showPressure && (
          <PressureRisingTool
            onClose={() => setShowPressure(false)}
            onReachOut={() => setShowPressure(false)}
          />
        )}
        {showTemptation && (
          <TemptationTool
            onClose={() => setShowTemptation(false)}
            onReachOut={() => setShowTemptation(false)}
          />
        )}
        {showGraceProtocol && <GraceProtocol onClose={() => setShowGraceProtocol(false)} />}
      </AnimatePresence>
    </AppLayout>
  );
};

export default ToolsPage;
