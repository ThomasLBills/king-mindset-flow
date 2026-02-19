import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useFreedomStreak } from "@/hooks/useDailyProgress";
import { useRelapseEventLogger } from "@/hooks/useTriggerPatterns";
import { useEvidenceCounter } from "@/hooks/useEvidenceCounter";

const TOTAL_STEPS = 6;

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

const QuoteBox = ({ children, italic = true }: { children: React.ReactNode; italic?: boolean }) => (
  <div className="bg-white/5 border border-primary/20 rounded-xl p-5 w-full max-w-sm">
    <p className={`font-serif text-base text-white leading-relaxed ${italic ? "italic" : ""}`}>
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
  const navigate = useNavigate();
  const { resetStreak } = useFreedomStreak();
  const { logRelapseEvent } = useRelapseEventLogger();
  const { addEvidence } = useEvidenceCounter();

  const next = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
  };

  const skip = () => next();

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
        <Shield className="w-[60px] h-[60px] text-primary mb-6" />
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
      className="fixed inset-0 z-50 bg-[#111111] flex flex-col"
    >
      <div className="flex justify-end p-4">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* STEP 1: RECOGNIZE THE TRUTH */}
          {step === 0 && (
            <StepWrapper key="r">
              <Shield className="w-[60px] h-[60px] text-primary mb-6" />
              <h2 className="font-serif text-2xl font-bold text-white mb-4 text-center">Recognize The Truth</h2>
              <p className="text-sm text-white leading-relaxed text-center mb-4 max-w-sm">
                Don't open another tab. Close everything. Stand up. Walk away from the screen.
              </p>
              <p className="text-sm text-white font-semibold mb-3">Speak this out loud:</p>
              <QuoteBox>
                "The verdict is still settled. Romans 8:1 is still true. I am still fully accepted. This failure does not define me."
              </QuoteBox>
              <p className="text-sm text-white text-center mt-4 mb-6 max-w-sm">
                You're not suppressing the guilt. You're anchoring to truth before the spiral takes over.
              </p>
              <Button onClick={next} className="w-full rounded-xl font-bold h-12 text-base bg-primary text-[#0A0A0A] hover:bg-primary/90 max-w-sm">Continue</Button>
              <button onClick={skip} className="text-sm text-white mt-3 hover:text-white/70 transition-colors">Skip</button>
            </StepWrapper>
          )}

          {/* STEP 2: ENGAGE THE FATHER */}
          {step === 1 && (
            <StepWrapper key="e">
              <Shield className="w-[60px] h-[60px] text-primary mb-6" />
              <h2 className="font-serif text-2xl font-bold text-white mb-4 text-center">Engage The Father</h2>
              <p className="text-sm text-white leading-relaxed text-center mb-4 max-w-sm">
                Don't hide. Don't delay. Go to God immediately as a son, not a slave.
              </p>
              <p className="text-sm text-white font-semibold mb-3">Pray this out loud:</p>
              <QuoteBox>
                "Father, I fell. I'm not hiding. I'm here. Thank You that this doesn't change my standing. Thank You that I'm still Your son. I receive Your grace right now. Help me learn from this."
              </QuoteBox>
              <p className="text-sm text-white text-center mt-4 mb-6 max-w-sm">
                Short. Honest. No performing.
              </p>
              <Button onClick={next} className="w-full rounded-xl font-bold h-12 text-base bg-primary text-[#0A0A0A] hover:bg-primary/90 max-w-sm">Continue</Button>
              <button onClick={skip} className="text-sm text-white mt-3 hover:text-white/70 transition-colors">Skip</button>
            </StepWrapper>
          )}

          {/* STEP 3: TRACE WHAT HAPPENED */}
          {step === 2 && (
            <StepWrapper key="t">
              <Shield className="w-[60px] h-[60px] text-primary mb-6" />
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
              <button onClick={skip} className="text-sm text-white mt-3 hover:text-white/70 transition-colors">Skip</button>
            </StepWrapper>
          )}

          {/* STEP 4: UPROOT ISOLATION */}
          {step === 3 && (
            <StepWrapper key="u">
              <Shield className="w-[60px] h-[60px] text-primary mb-6" />
              <h2 className="font-serif text-2xl font-bold text-white mb-4 text-center">Uproot Isolation</h2>
              <p className="text-sm text-white leading-relaxed text-center mb-4 max-w-sm">
                Don't isolate. Shame grows in secrecy.
              </p>
              <p className="text-sm text-white font-semibold mb-3">Text someone in your brotherhood:</p>
              <QuoteBox italic={false}>
                I fell tonight. Not spiraling—just being honest. I'm still in the fight.
              </QuoteBox>
              <p className="text-sm text-white text-center mt-4 mb-4 max-w-sm">
                You don't need a long conversation. You need to break isolation.
              </p>
              <div className="space-y-3 w-full max-w-sm mb-2">
                <Button
                  onClick={() => { onClose(); navigate("/brotherhood"); }}
                  className="w-full rounded-xl font-bold h-12 text-base bg-primary text-[#0A0A0A] hover:bg-primary/90 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Message a brother now
                </Button>
                <Button
                  onClick={next}
                  variant="outline"
                  className="w-full rounded-xl font-bold h-12 text-base bg-[#1C1C1E] border-primary/30 text-white hover:bg-white/10"
                >
                  I'll reach out later
                </Button>
              </div>
              <button onClick={skip} className="text-sm text-white mt-3 hover:text-white/70 transition-colors">Skip</button>
            </StepWrapper>
          )}

          {/* STEP 5: RESUME NORMAL RHYTHMS */}
          {step === 4 && (
            <StepWrapper key="r2">
              <Shield className="w-[60px] h-[60px] text-primary mb-6" />
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
              <p className="text-sm text-white text-center mt-4 mb-6 max-w-sm">
                The goal is return, not self-punishment.
              </p>
              <Button onClick={next} className="w-full rounded-xl font-bold h-12 text-base bg-primary text-[#0A0A0A] hover:bg-primary/90 max-w-sm">Continue</Button>
              <button onClick={skip} className="text-sm text-white mt-3 hover:text-white/70 transition-colors">Skip</button>
            </StepWrapper>
          )}

          {/* STEP 6: NAVIGATE FORWARD */}
          {step === 5 && (
            <StepWrapper key="n">
              <Shield className="w-[60px] h-[60px] text-primary mb-6" />
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
