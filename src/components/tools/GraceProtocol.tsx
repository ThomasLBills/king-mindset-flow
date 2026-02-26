import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useFreedomStreak } from "@/hooks/useDailyProgress";
import { useRelapseEventLogger } from "@/hooks/useTriggerPatterns";
import { useEvidenceCounter } from "@/hooks/useEvidenceCounter";

const TOTAL_STEPS = 6;

const step1Declarations = [
  "The verdict is still settled. Romans 8:1 is still true. I am still fully accepted. This failure does not define me.",
  "I am still His son. This moment doesn't change my identity. The Father still sees me through Christ, not through this failure.",
  "Grace is not permission to sin. Grace is permission to return. I am returning now as a son, not as a slave.",
  "My access to the Father is through Christ's blood, not my performance. I am coming home, not earning my way back.",
  "This failure does not disqualify me. Jesus paid for this moment on the cross. I am still covered. I am still His.",
  "Shame says I'm done. Grace says I can return. I choose grace. I am returning now.",
  "I am not my worst moment. I am who God says I am. His son. Forgiven. Accepted. Loved.",
  "The enemy wants me to spiral. God invites me to return. I refuse shame. I receive grace. I am returning now.",
  "My identity is not up for debate. I am sealed by the Holy Spirit. This failure cannot change what Christ has done.",
  "I fell. I am not staying down. Romans 8:1 is still true. There is no condemnation. I am returning as a son.",
];

const step2Prayers = [
  "Father, I fell. I'm not hiding. I'm here. Thank You that this doesn't change my standing. Thank You that I'm still Your son. I receive Your grace right now. Help me learn from this.",
  "Father, I'm coming to You as a son, not a slave. I failed, and I'm not staying in the shame. Thank You that Romans 8:1 is still true. Help me see what led to this.",
  "God, I don't deserve Your grace. That's exactly the point. Thank You that my access to You is through Christ, not through my performance. I'm here. I'm listening. Help me return.",
  "Father, I'm not hiding from You. I'm running to You. Thank You that You don't receive me based on what I've done. You receive me because of what Christ has done. I receive that now.",
  "God, I'm here. Not because I earned it. Because You invited me. Thank You that Your grace is bigger than my failure. I receive it. Help me walk forward.",
  "Father, I failed. I'm not making excuses. I'm also not staying in the shame. Thank You that my standing is secure in Christ. Help me learn what led to this.",
  "God, I come to You as Your son. I fell, and I'm not pretending I didn't. Thank You that You don't turn me away. Thank You that grace is real. I receive it now.",
  "Father, shame is loud right now. Your voice is louder. Thank You that I'm still Yours. Thank You that this moment doesn't define me. Help me see clearly.",
  "God, I'm not spiraling. I'm returning. Thank You that Your arms are open. Thank You that Your grace is sufficient. I receive it. Help me walk in freedom.",
  "Father, I don't deserve to be here. That's the gospel. None of us do. Thank You that Christ made a way. I'm here because of Him, not because of me. I receive Your grace.",
];

interface GraceProtocolProps {
  onClose: () => void;
}

const StepWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="flex flex-col items-center w-full max-w-md"
  >
    {children}
  </motion.div>
);

const QuoteBox = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white/5 border border-primary/20 rounded-xl p-5 w-full max-w-sm">
    <p className="font-serif text-base text-white leading-relaxed">
      {children}
    </p>
  </div>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2 w-full max-w-sm text-left">
    {items.map((item, i) => (
      <li key={i} className="text-sm text-white leading-relaxed flex gap-2">
        <span className="text-white mt-0.5">•</span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const GraceProtocol = ({ onClose }: GraceProtocolProps) => {
  const [step, setStep] = useState(0);
  const [traceNotes, setTraceNotes] = useState("");
  const [showCompletion, setShowCompletion] = useState(false);
  const [brotherhoodCommitted, setBrotherhoodCommitted] = useState(false);
  const [rhythmsCommitted, setRhythmsCommitted] = useState(false);
  const navigate = useNavigate();
  const { resetStreak } = useFreedomStreak();
  const { logRelapseEvent } = useRelapseEventLogger();
  const { addEvidence } = useEvidenceCounter();

  // Randomly select declaration and prayer each time the step loads
  const selectedDeclaration = useMemo(() => step1Declarations[Math.floor(Math.random() * step1Declarations.length)], [step]);
  const selectedPrayer = useMemo(() => step2Prayers[Math.floor(Math.random() * step2Prayers.length)], [step]);

  const next = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
  };

  const handleComplete = async () => {
    await logRelapseEvent.mutateAsync();
    await resetStreak.mutateAsync();
    addEvidence.mutate("grace_protocol_complete");
    setShowCompletion(true);
    setTimeout(() => {
      onClose();
      navigate("/app");
    }, 1500);
  };

  if (showCompletion) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-[#111111] flex flex-col items-center justify-center px-8"
      >
        <h2 className="font-serif text-2xl font-bold text-white text-center">
          You returned. You are still His.
        </h2>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-fullscreen bg-[#111111]"
    >
      <div className="flex justify-end p-4">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="modal-fullscreen-body">
        <AnimatePresence mode="wait">
          {/* STEP 1: RECOGNIZE THE TRUTH */}
          {step === 0 && (
            <StepWrapper key="r">
              <h2 className="font-serif text-2xl font-bold text-white mb-4 text-center">Recognize The Truth</h2>
              <p className="text-sm text-white leading-relaxed text-center mb-4 max-w-sm">
                Don't open another tab. Close everything. Stand up. Walk away from the screen.
              </p>
              <p className="text-sm text-white font-semibold mb-3">Speak this out loud:</p>
              <QuoteBox>"{selectedDeclaration}"</QuoteBox>
              <p className="text-sm text-white text-center mt-4 mb-6 max-w-sm">
                You're not suppressing the guilt. You're anchoring to truth before the spiral takes over.
              </p>
              <Button onClick={next} className="w-full rounded-xl font-bold h-12 text-base bg-primary text-[#0A0A0A] hover:bg-primary/90 max-w-sm">Continue</Button>
            </StepWrapper>
          )}

          {/* STEP 2: ENGAGE THE FATHER */}
          {step === 1 && (
            <StepWrapper key="e">
              <h2 className="font-serif text-2xl font-bold text-white mb-4 text-center">Engage The Father</h2>
              <p className="text-sm text-white leading-relaxed text-center mb-4 max-w-sm">
                Don't hide. Don't delay. Go to God immediately as a son, not a slave.
              </p>
              <p className="text-sm text-white font-semibold mb-3">Pray this out loud:</p>
              <QuoteBox>"{selectedPrayer}"</QuoteBox>
              <p className="text-sm text-white text-center mt-4 mb-6 max-w-sm">
                Short. Honest. No performing.
              </p>
              <Button onClick={next} className="w-full rounded-xl font-bold h-12 text-base bg-primary text-[#0A0A0A] hover:bg-primary/90 max-w-sm">Continue</Button>
            </StepWrapper>
          )}

          {/* STEP 3: TRACE WHAT HAPPENED */}
          {step === 2 && (
            <StepWrapper key="t">
              <h2 className="font-serif text-2xl font-bold text-white mb-4 text-center">Trace What Happened</h2>
              <p className="text-sm text-white leading-relaxed text-center mb-4 max-w-sm">
                Shame says: "You're disgusting. You'll never change."{"\n\n"}
                Grace asks: "What actually happened? What led to this?"
              </p>
              <p className="text-sm text-white font-semibold mb-3">Ask yourself:</p>
              <BulletList items={[
                "What pressure was I under?",
                "What was I actually seeking? Relief? Escape? Comfort?",
                "When did I drift from Spirit-dependence?",
                "What was the first moment I could have chosen differently?",
              ]} />
              <p className="text-sm text-white text-center mt-4 mb-4 max-w-sm">
                Don't judge. Just observe. This is data, not condemnation.
              </p>
              <textarea
                value={traceNotes}
                onChange={(e) => setTraceNotes(e.target.value)}
                placeholder="Write what you're noticing:"
                className="w-full max-w-sm bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-white/25 resize-none focus:outline-none focus:border-primary/50 transition-colors mb-6"
                rows={3}
              />
              <Button onClick={next} className="w-full rounded-xl font-bold h-12 text-base bg-primary text-[#0A0A0A] hover:bg-primary/90 max-w-sm">Continue</Button>
            </StepWrapper>
          )}

          {/* STEP 4: UPROOT ISOLATION */}
          {step === 3 && (
            <StepWrapper key="u">
              <h2 className="font-serif text-2xl font-bold text-white mb-4 text-center">Uproot Isolation</h2>
              <p className="text-sm text-white leading-relaxed text-center mb-4 max-w-sm">
                Don't isolate. Shame grows in secrecy.
              </p>
              <p className="text-sm text-white font-semibold mb-3">Text someone in your brotherhood:</p>
              <QuoteBox>
                I fell tonight. Not spiraling, just being honest. I'm still in the fight.
              </QuoteBox>
              <p className="text-sm text-white text-center mt-4 mb-4 max-w-sm">
                You don't need a long conversation. You need to break isolation.
              </p>

              {/* Commitment checkbox */}
              <div className="w-full max-w-sm bg-[#1C1C1E] border-2 border-primary rounded-lg p-4 mb-6">
                <button
                  onClick={() => setBrotherhoodCommitted(!brotherhoodCommitted)}
                  className="flex items-center gap-3 w-full"
                >
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${brotherhoodCommitted ? "bg-primary border-primary" : "border-primary bg-transparent"}`}>
                    {brotherhoodCommitted && <Check className="w-4 h-4 text-[#0A0A0A]" />}
                  </div>
                  <span className="text-white text-sm font-medium text-left">I commit to reach out to a brother</span>
                </button>
              </div>

              <Button
                onClick={next}
                disabled={!brotherhoodCommitted}
                className={`w-full rounded-xl font-bold h-12 text-base max-w-sm transition-colors ${brotherhoodCommitted ? "bg-primary text-[#0A0A0A] hover:bg-primary/90" : "bg-[#1C1C1E] border border-primary/30 text-white/50 cursor-not-allowed"}`}
              >
                Continue
              </Button>
            </StepWrapper>
          )}

          {/* STEP 5: RESUME NORMAL RHYTHMS */}
          {step === 4 && (
            <StepWrapper key="r2">
              <h2 className="font-serif text-2xl font-bold text-white mb-4 text-center">Resume Normal Rhythms</h2>
              <p className="text-sm text-white leading-relaxed text-center mb-4 max-w-sm">
                Don't punish yourself. Don't try to earn back your standing through extra disciplines.
              </p>
              <p className="text-sm text-white font-semibold mb-3">Return to normal:</p>
              <BulletList items={[
                "Go to bed at your normal time",
                "Wake up tomorrow as a son, not a failure",
                "Continue your daily practices without shame-driven intensity",
              ]} />
              <p className="text-sm text-white text-center mt-4 mb-4 max-w-sm">
                The goal is return, not self-punishment.
              </p>

              <div className="w-full max-w-sm bg-[#1C1C1E] border-2 border-primary rounded-lg p-4 mb-6">
                <button
                  onClick={() => setRhythmsCommitted(!rhythmsCommitted)}
                  className="flex items-center gap-3 w-full"
                >
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${rhythmsCommitted ? "bg-primary border-primary" : "border-primary bg-transparent"}`}>
                    {rhythmsCommitted && <Check className="w-4 h-4 text-[#0A0A0A]" />}
                  </div>
                  <span className="text-white text-sm font-medium text-left">I commit to return to normal rhythms, not self-punishment</span>
                </button>
              </div>

              <Button
                onClick={next}
                disabled={!rhythmsCommitted}
                className={`w-full rounded-xl font-bold h-12 text-base max-w-sm transition-colors ${rhythmsCommitted ? "bg-primary text-[#0A0A0A] hover:bg-primary/90" : "bg-[#1C1C1E] border border-primary/30 text-white/50 cursor-not-allowed"}`}
              >
                Continue
              </Button>
            </StepWrapper>
          )}

          {/* STEP 6: NAVIGATE FORWARD */}
          {step === 5 && (
            <StepWrapper key="n">
              <h2 className="font-serif text-2xl font-bold text-white mb-4 text-center">Navigate Forward</h2>
              <p className="text-sm text-white leading-relaxed text-center mb-4 max-w-sm">
                After the shame has settled, reflect:
              </p>
              <BulletList items={[
                "What pattern am I noticing?",
                "What trigger did I miss?",
                "What new practice or boundary might help?",
                "What do I need to bring to my next group call?",
              ]} />
              <p className="text-sm text-white text-center mt-4 mb-6 max-w-sm">
                Failure is feedback. Use it.
              </p>
              <Button
                onClick={handleComplete}
                disabled={resetStreak.isPending || logRelapseEvent.isPending}
                className="w-full rounded-xl font-bold h-12 text-base bg-primary text-[#0A0A0A] hover:bg-primary/90 max-w-sm"
              >
                Complete RETURN
              </Button>
            </StepWrapper>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default GraceProtocol;
