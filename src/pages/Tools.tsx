import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, RotateCcw, Layers, Heart, BookOpen, Users } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import GraceProtocol from "@/components/tools/GraceProtocol";
import GratitudeModal from "@/components/tools/GratitudeModal";
import ScriptureTool from "@/components/tools/ScriptureTool";
import DeclarationsModal from "@/components/tools/DeclarationsModal";
import ReachOut from "@/components/brotherhood/ReachOut";
import { SpiritLedCrisisModal } from "@/components/layout/SpiritLedCrisisButton";

const systemSans = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

const ToolsPage = () => {
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [showReachOut, setShowReachOut] = useState(false);
  const [showGraceProtocol, setShowGraceProtocol] = useState(false);
  const [showDeclarations, setShowDeclarations] = useState(false);
  const [showGratitude, setShowGratitude] = useState(false);
  const [showScripture, setShowScripture] = useState(false);

  const actionCards = [
    {
      title: "I Am Being Tempted",
      subtitle: "Notice. Name. Navigate.",
      icon: ShieldCheck,
      onClick: () => setShowCrisisModal(true),
      urgent: true,
      gold: false,
    },
    {
      title: "Reach Out Now",
      subtitle: "Call on a brother",
      icon: Users,
      onClick: () => setShowReachOut(true),
      urgent: false,
      gold: true,
    },
    {
      title: "I Need to Return",
      subtitle: "R.E.T.U.R.N.",
      icon: RotateCcw,
      onClick: () => setShowGraceProtocol(true),
      urgent: false,
      gold: false,
    },
    {
      title: "Speak Truth Over Myself",
      subtitle: "Declare. Believe. Receive.",
      icon: Layers,
      onClick: () => setShowDeclarations(true),
      urgent: false,
      gold: false,
    },
    {
      title: "Gratitude",
      subtitle: "See what God is already doing.",
      icon: Heart,
      onClick: () => setShowGratitude(true),
      urgent: false,
      gold: false,
    },
    {
      title: "Scripture",
      subtitle: "The sword of the Spirit.",
      icon: BookOpen,
      onClick: () => setShowScripture(true),
      urgent: false,
      gold: false,
    },
  ];

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-2 pb-5"
        >
          <h1 className="armor-page-title text-[26px]" style={{ color: "hsl(var(--foreground))" }}>
            Your Armor
          </h1>
          <p
            style={{
              fontFamily: systemSans,
              fontWeight: 400,
              fontSize: "15px",
              color: "hsl(var(--foreground) / 0.65)",
              marginTop: "4px",
            }}
          >
            Put on the full armor of God. Choose what your moment requires.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <p
            style={{
              fontFamily: systemSans,
              fontWeight: 500,
              fontSize: "14px",
              color: "hsl(var(--foreground) / 0.8)",
              marginBottom: "14px",
            }}
          >
            What do you need right now?
          </p>

          <div className="flex flex-col gap-[10px]">
            {actionCards.map(({ title, subtitle, icon: Icon, onClick, urgent }) => (
              <motion.button
                key={title}
                onClick={onClick}
                whileTap={{ scale: 0.98 }}
                className={urgent ? "armor-action-card armor-action-card--urgent" : "armor-action-card"}
              >
                <div className="armor-action-card__icon">
                  <Icon className="w-[22px] h-[22px]" strokeWidth={2} />
                </div>
                <div className="armor-action-card__content">
                  <span className="armor-action-card__title">{title}</span>
                  <span className="armor-action-card__subtitle">{subtitle}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showCrisisModal && <SpiritLedCrisisModal onClose={() => setShowCrisisModal(false)} />}
        {showGraceProtocol && <GraceProtocol onClose={() => setShowGraceProtocol(false)} />}
        {showGratitude && <GratitudeModal onClose={() => setShowGratitude(false)} />}
        {showDeclarations && <DeclarationsModal onClose={() => setShowDeclarations(false)} />}
        {showScripture && <ScriptureTool onClose={() => setShowScripture(false)} />}
      </AnimatePresence>
    </AppLayout>
  );
};

export default ToolsPage;