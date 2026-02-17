import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import GraceProtocol from "@/components/tools/GraceProtocol";
import { SpiritLedCrisisModal } from "@/components/layout/SpiritLedCrisisButton";

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

const ToolsPage = () => {
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [showGraceProtocol, setShowGraceProtocol] = useState(false);
  const [showScriptureModal, setShowScriptureModal] = useState(false);
  const [scriptureIndex, setScriptureIndex] = useState(0);

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
          <h2 className="font-semibold text-base mb-4">What do you need right now?</h2>
          <div className="flex flex-col gap-4">
            <motion.button
              onClick={() => setShowCrisisModal(true)}
              whileTap={{ scale: 1.02 }}
              className="flex-1 py-6 px-10 rounded-xl text-center bg-[#1C1C1E] border-[1.5px] border-primary active:bg-primary active:text-[#0A0A0A] transition-colors duration-200"
            >
              <span className="block font-bold text-white text-base active:text-[#0A0A0A]">I Need Strength</span>
              <span className="block text-sm text-primary mt-1">Stand against temptation</span>
            </motion.button>
            <motion.button
              onClick={() => setShowGraceProtocol(true)}
              whileTap={{ scale: 1.02 }}
              className="flex-1 py-6 px-10 rounded-xl text-center bg-[#1C1C1E] border-[1.5px] border-primary active:bg-primary active:text-[#0A0A0A] transition-colors duration-200"
            >
              <span className="block font-bold text-white text-base active:text-[#0A0A0A]">I Need Grace</span>
              <span className="block text-sm text-primary mt-1">Return quickly</span>
            </motion.button>
            <motion.button
              onClick={() => setShowScriptureModal(true)}
              whileTap={{ scale: 1.02 }}
              className="flex-1 py-6 px-10 rounded-xl text-center bg-[#1C1C1E] border-[1.5px] border-primary active:bg-primary active:text-[#0A0A0A] transition-colors duration-200"
            >
              <span className="block font-bold text-white text-base active:text-[#0A0A0A]">God's Truth For This Moment</span>
              <span className="block text-sm text-primary mt-1">Anchor yourself in Scripture</span>
            </motion.button>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showCrisisModal && <SpiritLedCrisisModal onClose={() => setShowCrisisModal(false)} />}
        {showGraceProtocol && <GraceProtocol onClose={() => setShowGraceProtocol(false)} />}
        {showScriptureModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center px-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="max-w-lg w-full text-center"
            >
              <p className="font-serif text-2xl text-white italic leading-relaxed mb-6">
                "{armorScriptures[scriptureIndex].text}"
              </p>
              <p className="text-base text-primary font-medium mb-10">
                {armorScriptures[scriptureIndex].reference}
              </p>
              <button
                onClick={() => setScriptureIndex((prev) => (prev + 1) % armorScriptures.length)}
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base mb-4"
              >
                Next Scripture
              </button>
              <button
                onClick={() => setShowScriptureModal(false)}
                className="text-white/70 text-sm hover:text-white transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
};

export default ToolsPage;
