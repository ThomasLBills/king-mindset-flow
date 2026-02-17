import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, BookOpen, Megaphone, X } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import GraceProtocol from "@/components/tools/GraceProtocol";
import { SpiritLedCrisisModal } from "@/components/layout/SpiritLedCrisisButton";
import { useEvidenceCounter } from "@/hooks/useEvidenceCounter";

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

const declarations = [
  { text: "I am a child of God, and He loves me unconditionally.", reference: "John 1:12, Romans 8:38-39" },
  { text: "I have been redeemed and forgiven of my sins through the sacrifice of Jesus on the cross.", reference: "Ephesians 1:7" },
  { text: "I am a new creation in Christ, and my old self has passed away.", reference: "2 Corinthians 5:17" },
  { text: "I have been given a spirit of power, love, and self-discipline, not fear.", reference: "2 Timothy 1:7" },
  { text: "I am free in Christ. The chains are broken.", reference: "Galatians 5:1" },
  { text: "I am being transformed by the renewing of my mind.", reference: "Romans 12:2" },
];

const ToolsPage = () => {
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [showGraceProtocol, setShowGraceProtocol] = useState(false);
  const [showScriptureModal, setShowScriptureModal] = useState(false);
  const [scriptureIndex, setScriptureIndex] = useState(0);
  const [showDeclarations, setShowDeclarations] = useState(false);
  const [declarationIndex, setDeclarationIndex] = useState(0);
  const { addEvidence } = useEvidenceCounter();

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
              className="py-6 px-10 rounded-xl text-center bg-[#1C1C1E] border-[1.5px] border-primary active:bg-primary active:text-[#0A0A0A] transition-colors duration-200"
            >
              <span className="block font-bold text-white text-base">I Need God's Strength</span>
              <span className="block text-sm text-primary mt-1">Stand against temptation</span>
            </motion.button>
            <motion.button
              onClick={() => setShowGraceProtocol(true)}
              whileTap={{ scale: 1.02 }}
              className="py-6 px-10 rounded-xl text-center bg-[#1C1C1E] border-[1.5px] border-primary active:bg-primary active:text-[#0A0A0A] transition-colors duration-200"
            >
              <span className="block font-bold text-white text-base">I Need God's Grace</span>
              <span className="block text-sm text-primary mt-1">Return quickly</span>
            </motion.button>
            <motion.button
              onClick={() => setShowScriptureModal(true)}
              whileTap={{ scale: 1.02 }}
              className="py-6 px-10 rounded-xl text-center bg-[#1C1C1E] border-[1.5px] border-primary active:bg-primary active:text-[#0A0A0A] transition-colors duration-200"
            >
              <span className="block font-bold text-white text-base">God's Truth For This Moment</span>
              <span className="block text-sm text-primary mt-1">Anchor yourself in Scripture</span>
            </motion.button>
            <motion.button
              onClick={() => { setDeclarationIndex(0); setShowDeclarations(true); }}
              whileTap={{ scale: 1.02 }}
              className="py-6 px-10 rounded-xl text-center bg-[#1C1C1E] border-[1.5px] border-primary active:bg-primary active:text-[#0A0A0A] transition-colors duration-200"
            >
              <span className="block font-bold text-white text-base">Speak Truth Over Myself</span>
              <span className="block text-sm text-primary mt-1">Declare who God says you are</span>
            </motion.button>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showCrisisModal && <SpiritLedCrisisModal onClose={() => setShowCrisisModal(false)} />}
        {showGraceProtocol && <GraceProtocol onClose={() => setShowGraceProtocol(false)} />}

        {/* Modal 3: God's Truth */}
        {showScriptureModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#111111] flex flex-col"
          >
            {/* Close button */}
            <div className="flex justify-end p-4">
              <button onClick={() => setShowScriptureModal(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-8">
              {/* Progress dots */}
              <div className="flex gap-2 mb-8">
                {armorScriptures.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${i === scriptureIndex ? 'bg-primary' : 'bg-white/30'}`}
                  />
                ))}
              </div>

              <BookOpen className="w-[60px] h-[60px] text-primary mb-6" />

              <AnimatePresence mode="wait">
                <motion.div
                  key={scriptureIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.25 }}
                  className="text-center max-w-lg w-full"
                >
                  <p className="font-serif text-2xl text-white italic leading-relaxed mb-6">
                    "{armorScriptures[scriptureIndex].text}"
                  </p>
                  <p className="text-base text-primary font-medium">
                    {armorScriptures[scriptureIndex].reference}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="mt-10 max-w-lg w-full">
                <button
                  onClick={() => setScriptureIndex((prev) => (prev + 1) % armorScriptures.length)}
                  className="w-full py-4 rounded-xl bg-primary text-[#0A0A0A] font-bold text-base mb-4"
                >
                  Next Scripture
                </button>
                <div className="text-center">
                  <button
                    onClick={() => setShowScriptureModal(false)}
                    className="text-sm text-white hover:text-white/70 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Modal 4: Declarations */}
        {showDeclarations && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#111111] flex flex-col"
          >
            {/* Close button */}
            <div className="flex justify-end p-4">
              <button onClick={() => setShowDeclarations(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-8">
              {/* Progress dots */}
              <div className="flex gap-2 mb-8">
                {declarations.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${i === declarationIndex ? 'bg-primary' : 'bg-white/30'}`}
                  />
                ))}
              </div>

              <Megaphone className="w-[60px] h-[60px] text-primary mb-6" />

              <div className="relative max-w-lg w-full flex items-center">
                <button
                  onClick={() => setDeclarationIndex((prev) => (prev - 1 + declarations.length) % declarations.length)}
                  className="absolute -left-4 sm:-left-8 text-white/50 hover:text-white transition-colors z-10"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={declarationIndex}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.25 }}
                    className="text-center w-full px-8"
                  >
                    <p className="font-serif text-2xl text-white font-bold leading-relaxed mb-6">
                      "{declarations[declarationIndex].text}"
                    </p>
                    <p className="text-base text-primary font-medium">
                      {declarations[declarationIndex].reference}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <button
                  onClick={() => setDeclarationIndex((prev) => (prev + 1) % declarations.length)}
                  className="absolute -right-4 sm:-right-8 text-white/50 hover:text-white transition-colors z-10"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </div>

              <div className="mt-10 max-w-lg w-full">
                <button
                  onClick={() => { addEvidence.mutate("declaration"); setShowDeclarations(false); }}
                  className="w-full py-4 rounded-xl bg-primary text-[#0A0A0A] font-bold text-base"
                >
                  I believe this. Close.
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
};

export default ToolsPage;
