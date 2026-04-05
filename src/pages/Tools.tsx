import { useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ShieldCheck, RotateCcw, Layers, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import GraceProtocol from "@/components/tools/GraceProtocol";
import GratitudeModal from "@/components/tools/GratitudeModal";
import { SpiritLedCrisisModal } from "@/components/layout/SpiritLedCrisisButton";
import { useEvidenceCounter } from "@/hooks/useEvidenceCounter";
import { Button } from "@/components/ui/button";

const declarations = [
{ text: "I am a child of God, and He loves me unconditionally.", reference: "John 1:12, Romans 8:38-39" },
{ text: "I have been redeemed and forgiven of my sins through the sacrifice of Jesus on the cross.", reference: "Ephesians 1:7" },
{ text: "I am a new creation in Christ, and my old self has passed away.", reference: "2 Corinthians 5:17" },
{ text: "I have been given a spirit of power, love, and self-discipline, not fear.", reference: "2 Timothy 1:7" },
{ text: "I am free in Christ. The chains are broken.", reference: "Galatians 5:1" },
{ text: "I am being transformed by the renewing of my mind.", reference: "Romans 12:2" }];


// ========== Declarations Modal ==========
const DeclarationsModal = ({ onClose }: {onClose: () => void;}) => {
  const [showCompletion, setShowCompletion] = useState(false);
  const { addEvidence } = useEvidenceCounter();

  const selectedDeclaration = useMemo(
    () => declarations[Math.floor(Math.random() * declarations.length)],
    []
  );

  const navigate = useNavigate();

  const handleBelieve = () => {
    addEvidence.mutate("declaration");
    setShowCompletion(true);
    setTimeout(() => {
      onClose();
      navigate("/app");
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-fullscreen bg-[#111111]">
      
      {/* Completion Overlay */}
      <AnimatePresence>
        {showCompletion &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-[#111111]">
          
            <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="font-serif text-2xl font-bold text-white mb-3 text-center">
            
              Truth declared.
            </motion.h2>
            <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-white text-base text-center">
            
              You are building evidence.
            </motion.p>
          </motion.div>
        }
      </AnimatePresence>

      {/* Close button */}
      <div className="flex justify-end p-4">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="modal-fullscreen-body">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center w-full max-w-sm">
          
          <h2 className="font-serif text-2xl font-bold text-white mb-1 text-center">Speak Truth Over Myself</h2>
          <p className="text-sm text-white text-center mb-6">Declare Who God Says You Are</p>
          <p className="text-sm text-white text-center mb-6 max-w-sm">
            Your identity is not up for debate. Speak this truth out loud:
          </p>

          <div className="bg-white/5 border border-primary/20 rounded-xl p-5 w-full mb-4">
            <p className="font-serif text-lg text-white leading-relaxed text-center italic">
              "{selectedDeclaration.text}"
            </p>
            <p className="text-sm text-primary mt-3 font-medium text-center">
              {selectedDeclaration.reference}
            </p>
          </div>

          <p className="text-sm text-white text-center mb-8 max-w-sm">
            Say it out loud. Let your ears hear what your mouth declares. Your brain rewires when you speak truth.
          </p>

          <Button
            onClick={handleBelieve}
            className="w-full rounded-xl font-bold h-12 text-base bg-primary text-[#0A0A0A] hover:bg-primary/90">
            
            I believe this.
          </Button>
        </motion.div>
      </div>
    </motion.div>);

};


const systemSans = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

const ToolsPage = () => {
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [showGraceProtocol, setShowGraceProtocol] = useState(false);
  const [showDeclarations, setShowDeclarations] = useState(false);
  const [showGratitude, setShowGratitude] = useState(false);

  const actionCards = [
    {
      title: "I Am Being Tempted",
      subtitle: "Notice. Name. Navigate.",
      icon: ShieldCheck,
      onClick: () => setShowCrisisModal(true),
      urgent: true,
    },
    {
      title: "I Need to Return",
      subtitle: "R.E.T.U.R.N.",
      icon: RotateCcw,
      onClick: () => setShowGraceProtocol(true),
      urgent: false,
    },
    {
      title: "Speak Truth Over Myself",
      subtitle: "Declare. Believe. Receive.",
      icon: Layers,
      onClick: () => setShowDeclarations(true),
      urgent: false,
    },
    {
      title: "Gratitude",
      subtitle: "See what God is already doing.",
      icon: Heart,
      onClick: () => setShowGratitude(true),
      urgent: false,
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
      </AnimatePresence>
    </AppLayout>
  );
};

export default ToolsPage;