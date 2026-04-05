import { useState, useMemo } from "react";
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


const ToolsPage = () => {
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [showGraceProtocol, setShowGraceProtocol] = useState(false);
  const [showDeclarations, setShowDeclarations] = useState(false);
  const [showGratitude, setShowGratitude] = useState(false);

  return (
    <AppLayout>
      <div className="px-4 py-6 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-2 pb-5">
          <h1
            style={{
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
              fontWeight: 600,
              fontSize: "26px",
              letterSpacing: "-0.02em",
              color: "#1A1A1A",
            }}
          >
            Your Armor
          </h1>
          <p
            style={{
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
              fontWeight: 400,
              fontSize: "15px",
              color: "rgba(26, 26, 26, 0.65)",
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
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
              fontWeight: 500,
              fontSize: "14px",
              color: "rgba(26, 26, 26, 0.8)",
              marginBottom: "14px",
            }}
          >
            What do you need right now?
          </p>
          <div className="flex flex-col gap-[10px]">
            {/* I Am Being Tempted — highlighted */}
            <motion.button
              onClick={() => setShowCrisisModal(true)}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-4 text-left active:opacity-80 transition-opacity"
              style={{
                background: "#1A1A1A",
                borderRadius: "0 16px 16px 0",
                borderLeft: "3px solid hsl(var(--primary))",
                borderTop: "none",
                borderRight: "none",
                borderBottom: "none",
                padding: "22px",
              }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: "rgba(184, 150, 63, 0.1)",
                }}
              >
                <ShieldCheck className="w-[22px] h-[22px]" style={{ color: "hsl(var(--primary))" }} />
              </div>
              <div>
                <span className="block" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", fontWeight: 600, fontSize: "17px", color: "#F5F3EE" }}>I Am Being Tempted</span>
                <span className="block text-primary" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", fontWeight: 400, fontSize: "13px", marginTop: "2px" }}>Notice. Name. Navigate.</span>
              </div>
            </motion.button>

            {/* I Need to Return */}
            <motion.button
              onClick={() => setShowGraceProtocol(true)}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-4 text-left active:opacity-80 transition-opacity"
              style={{
                background: "#1A1A1A",
                borderRadius: "16px",
                border: "none",
                padding: "22px",
              }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: "rgba(245, 243, 238, 0.04)",
                }}
              >
                <RotateCcw className="w-[22px] h-[22px]" style={{ color: "rgba(245, 243, 238, 0.4)" }} />
              </div>
              <div>
                <span className="block" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", fontWeight: 600, fontSize: "17px", color: "#F5F3EE" }}>I Need to Return</span>
                <span className="block text-primary" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", fontWeight: 400, fontSize: "13px", marginTop: "2px" }}>R.E.T.U.R.N.</span>
              </div>
            </motion.button>

            {/* Speak Truth Over Myself */}
            <motion.button
              onClick={() => setShowDeclarations(true)}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-4 text-left active:opacity-80 transition-opacity"
              style={{
                background: "#1A1A1A",
                borderRadius: "16px",
                border: "none",
                padding: "22px",
              }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: "rgba(245, 243, 238, 0.04)",
                }}
              >
                <Layers className="w-[22px] h-[22px]" style={{ color: "rgba(245, 243, 238, 0.4)" }} />
              </div>
              <div>
                <span className="block" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", fontWeight: 600, fontSize: "17px", color: "#F5F3EE" }}>Speak Truth Over Myself</span>
                <span className="block text-primary" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", fontWeight: 400, fontSize: "13px", marginTop: "2px" }}>Declare. Believe. Receive.</span>
              </div>
            </motion.button>

            {/* Gratitude */}
            <motion.button
              onClick={() => setShowGratitude(true)}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-4 text-left active:opacity-80 transition-opacity"
              style={{
                background: "#1A1A1A",
                borderRadius: "16px",
                border: "none",
                padding: "22px",
              }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: "rgba(245, 243, 238, 0.04)",
                }}
              >
                <Heart className="w-[22px] h-[22px]" style={{ color: "rgba(245, 243, 238, 0.4)" }} />
              </div>
              <div>
                <span className="block" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", fontWeight: 600, fontSize: "17px", color: "#F5F3EE" }}>Gratitude</span>
                <span className="block text-primary" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", fontWeight: 400, fontSize: "13px", marginTop: "2px" }}>See what God is already doing.</span>
              </div>
            </motion.button>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showCrisisModal && <SpiritLedCrisisModal onClose={() => setShowCrisisModal(false)} />}
        {showGraceProtocol && <GraceProtocol onClose={() => setShowGraceProtocol(false)} />}
        {showGratitude && <GratitudeModal onClose={() => setShowGratitude(false)} />}
        {showDeclarations && <DeclarationsModal onClose={() => setShowDeclarations(false)} />}
      </AnimatePresence>
    </AppLayout>);

};

export default ToolsPage;