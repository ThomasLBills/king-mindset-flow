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
const DeclarationsModal = ({ onClose }: { onClose: () => void }) => {
  const [showCompletion, setShowCompletion] = useState(false);
  const [holding, setHolding] = useState(false);
  const [completed, setCompleted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addEvidence } = useEvidenceCounter();

  const selectedDeclaration = useMemo(
    () => declarations[Math.floor(Math.random() * declarations.length)],
    []
  );

  const navigate = useNavigate();

  const handleBelieve = useCallback(() => {
    addEvidence.mutate("declaration");
    setShowCompletion(true);
    setTimeout(() => {
      onClose();
      navigate("/app");
    }, 1500);
  }, [addEvidence, onClose, navigate]);

  const startHold = useCallback(() => {
    if (completed) return;
    setHolding(true);
    timerRef.current = setTimeout(() => {
      setHolding(false);
      setCompleted(true);
      if (navigator.vibrate) navigator.vibrate(50);
      handleBelieve();
    }, 2000);
  }, [completed, handleBelieve]);

  const cancelHold = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    if (!completed) setHolding(false);
  }, [completed]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-fullscreen bg-[#111111]"
      style={{ fontFamily: systemSans }}
    >
      {/* Completion Overlay */}
      <AnimatePresence>
        {showCompletion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-[#111111]"
          >
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              style={{ fontFamily: systemSans, fontWeight: 600, fontSize: "24px", color: "#F5F3EE", textAlign: "center", marginBottom: "12px" }}
            >
              Truth declared.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{ color: "#F5F3EE", fontSize: "16px", textAlign: "center" }}
            >
              You are building evidence.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close button */}
      <div className="flex justify-end" style={{ padding: "20px 20px 0 20px" }}>
        <button onClick={onClose} className="transition-opacity hover:opacity-70" style={{ background: "none", border: "none", padding: 0 }}>
          <X className="w-6 h-6" style={{ color: "rgba(245, 243, 238, 0.5)" }} />
        </button>
      </div>

      <div className="modal-fullscreen-body" style={{ paddingTop: "24px" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col w-full max-w-sm"
        >
          <h2 style={{ fontFamily: systemSans, fontWeight: 600, fontSize: "24px", color: "#F5F3EE", letterSpacing: "-0.02em", marginBottom: "4px" }}>
            Speak Truth Over Myself
          </h2>
          <p style={{ fontSize: "14px", fontWeight: 500, color: "hsl(var(--primary))", marginBottom: "16px" }}>
            Declare Who God Says You Are
          </p>
          <p style={{ fontSize: "15px", fontWeight: 400, color: "#F5F3EE", marginBottom: "24px", lineHeight: 1.5 }}>
            Speak this over yourself:
          </p>

          {/* Scripture with left-border accent */}
          <div style={{ borderLeft: "3px solid hsl(var(--primary))", paddingLeft: "20px", marginBottom: "24px" }}>
            <p style={{ fontSize: "22px", fontWeight: 600, color: "#F5F3EE", lineHeight: 1.4 }}>
              {selectedDeclaration.text}
            </p>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "hsl(var(--primary))", marginTop: "12px" }}>
              {selectedDeclaration.reference}
            </p>
          </div>

          <p style={{ fontSize: "14px", fontWeight: 400, color: "#F5F3EE", marginBottom: "28px", lineHeight: 1.5 }}>
            Say it out loud. Let your ears hear what your mouth declares.{" "}
            <span style={{ color: "hsl(var(--primary))" }}>Your brain rewires when you speak truth.</span>
          </p>

          {/* Hold-to-confirm button */}
          <button
            onMouseDown={startHold}
            onMouseUp={cancelHold}
            onMouseLeave={cancelHold}
            onTouchStart={startHold}
            onTouchEnd={cancelHold}
            onTouchCancel={cancelHold}
            style={{
              position: "relative",
              width: "100%",
              padding: "16px",
              borderRadius: "12px",
              border: "none",
              fontSize: "15px",
              fontWeight: 600,
              fontFamily: systemSans,
              cursor: "pointer",
              background: completed ? "#B8963F" : "#F5F3EE",
              color: "#1A1A1A",
              overflow: "hidden",
              WebkitUserSelect: "none",
              userSelect: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                borderRadius: "12px",
                background: "#B8963F",
                width: holding ? "100%" : "0%",
                transition: holding ? "width 2s linear" : "width 0.15s ease-out",
              }}
            />
            <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              {completed ? (
                <><Check className="w-4 h-4" /> Declared</>
              ) : (
                "Hold to Declare"
              )}
            </span>
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
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