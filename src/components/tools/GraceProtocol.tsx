import { useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFreedomStreak } from "@/hooks/useDailyProgress";
import { useRelapseEventLogger } from "@/hooks/useTriggerPatterns";
import { useEvidenceCounter } from "@/hooks/useEvidenceCounter";

const TOTAL_STEPS = 6;

const sansFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

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

const stepSubtitles = [
  "Anchor to what is real",
  "Come as a son, not a slave",
  "Data, not condemnation",
  "Break the power of secrecy",
  "Return, not self-punishment",
  "Failure is feedback",
];

interface GraceProtocolProps {
  onClose: () => void;
}

const StepWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="flex flex-col w-full max-w-md"
    style={{ alignItems: "flex-start" }}
  >
    {children}
  </motion.div>
);

const Heading = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{
    fontFamily: sansFont,
    fontWeight: 600,
    fontSize: "24px",
    letterSpacing: "-0.02em",
    color: "#F5F3EE",
    textAlign: "left",
    marginBottom: "4px",
    width: "100%",
  }}>
    {children}
  </h2>
);

const Subtitle = ({ children }: { children: React.ReactNode }) => (
  <p style={{
    color: "hsl(var(--primary))",
    fontSize: "14px",
    fontWeight: 500,
    textAlign: "left",
    marginBottom: "20px",
    width: "100%",
  }}>
    {children}
  </p>
);

const BodyText = ({ children }: { children: React.ReactNode }) => (
  <p style={{
    fontSize: "15px",
    fontWeight: 400,
    color: "#F5F3EE",
    textAlign: "left",
    lineHeight: 1.6,
    marginBottom: "16px",
    width: "100%",
  }}>
    {children}
  </p>
);

const Declaration = ({ text, reference }: { text: string; reference?: string }) => (
  <div style={{
    borderLeft: "3px solid hsl(var(--primary))",
    paddingLeft: "20px",
    width: "100%",
    marginBottom: "20px",
  }}>
    <p style={{
      fontFamily: sansFont,
      fontSize: "20px",
      fontWeight: 600,
      color: "#F5F3EE",
      lineHeight: 1.4,
      textAlign: "left",
    }}>
      {text}
    </p>
    {reference && (
      <p style={{
        color: "hsl(var(--primary))",
        fontSize: "14px",
        fontWeight: 500,
        marginTop: "10px",
        textAlign: "left",
      }}>
        {reference}
      </p>
    )}
  </div>
);

const TeachingText = ({ regular, gold }: { regular: string; gold: string }) => (
  <p style={{
    fontSize: "14px",
    fontWeight: 400,
    color: "#F5F3EE",
    textAlign: "left",
    lineHeight: 1.6,
    marginBottom: "24px",
    width: "100%",
  }}>
    {regular}{" "}
    <span style={{ color: "hsl(var(--primary))" }}>{gold}</span>
  </p>
);

const ContinueButton = ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      width: "100%",
      background: disabled ? "#242424" : "hsl(var(--primary))",
      color: disabled ? "rgba(245,243,238,0.3)" : "#1A1A1A",
      fontWeight: 600,
      fontSize: "15px",
      border: "none",
      borderRadius: "12px",
      padding: "16px",
      cursor: disabled ? "not-allowed" : "pointer",
      outline: "none",
      boxShadow: "none",
      fontFamily: sansFont,
    }}
  >
    Continue
  </button>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul style={{ width: "100%", marginBottom: "16px" }} className="space-y-2">
    {items.map((item, i) => (
      <li key={i} style={{ fontSize: "14px", color: "#F5F3EE", lineHeight: 1.6, display: "flex", gap: "8px", textAlign: "left" }}>
        <span style={{ marginTop: "2px" }}>•</span>
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
        className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8"
        style={{ background: "#111111" }}
      >
        <h2 style={{
          fontFamily: sansFont,
          fontSize: "24px",
          fontWeight: 600,
          color: "#F5F3EE",
          textAlign: "center",
        }}>
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
      className="modal-fullscreen"
      style={{ background: "#111111" }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 60,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          outline: "none",
          boxShadow: "none",
        }}
      >
        <X style={{ width: 20, height: 20, color: "rgba(245,243,238,0.5)" }} />
      </button>

      <div className="modal-fullscreen-body">
        <AnimatePresence mode="wait">
          {/* STEP 1: RECOGNIZE THE TRUTH */}
          {step === 0 && (
            <StepWrapper key="r">
              <Heading>Recognize The Truth</Heading>
              <Subtitle>{stepSubtitles[0]}</Subtitle>
              <BodyText>Don't open another tab. Close everything. Stand up. Walk away from the screen.</BodyText>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "hsl(var(--primary))", textAlign: "left", marginBottom: "16px" }}>
                Speak this out loud:
              </p>
              <Declaration text={selectedDeclaration} />
              <TeachingText
                regular="You're not suppressing the guilt."
                gold="You're anchoring to truth before the spiral takes over."
              />
              <ContinueButton onClick={next} />
            </StepWrapper>
          )}

          {/* STEP 2: ENGAGE THE FATHER */}
          {step === 1 && (
            <StepWrapper key="e">
              <Heading>Engage The Father</Heading>
              <Subtitle>{stepSubtitles[1]}</Subtitle>
              <BodyText>Don't hide. Don't delay. Go to God immediately as a son, not a slave.</BodyText>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "hsl(var(--primary))", textAlign: "left", marginBottom: "16px" }}>
                Pray this out loud:
              </p>
              <Declaration text={selectedPrayer} />
              <TeachingText
                regular="Short. Honest."
                gold="No performing."
              />
              <ContinueButton onClick={next} />
            </StepWrapper>
          )}

          {/* STEP 3: TRACE WHAT HAPPENED */}
          {step === 2 && (
            <StepWrapper key="t">
              <Heading>Trace What Happened</Heading>
              <Subtitle>{stepSubtitles[2]}</Subtitle>
              <BodyText>
                Shame says: "You're disgusting. You'll never change." Grace asks: "What actually happened? What led to this?"
              </BodyText>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "hsl(var(--primary))", textAlign: "left", marginBottom: "12px" }}>
                Ask yourself:
              </p>
              <BulletList items={[
                "What pressure was I under?",
                "What was I actually seeking? Relief? Escape? Comfort?",
                "When did I drift from Spirit-dependence?",
                "What was the first moment I could have chosen differently?",
              ]} />
              <TeachingText
                regular="Don't judge. Just observe."
                gold="This is data, not condemnation."
              />
              <textarea
                value={traceNotes}
                onChange={(e) => setTraceNotes(e.target.value)}
                placeholder="Write what you're noticing:"
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  padding: "16px",
                  fontSize: "14px",
                  color: "#F5F3EE",
                  resize: "none",
                  outline: "none",
                  marginBottom: "24px",
                  fontFamily: sansFont,
                }}
                rows={3}
              />
              <ContinueButton onClick={next} />
            </StepWrapper>
          )}

          {/* STEP 4: UPROOT ISOLATION */}
          {step === 3 && (
            <StepWrapper key="u">
              <Heading>Uproot Isolation</Heading>
              <Subtitle>{stepSubtitles[3]}</Subtitle>
              <BodyText>Don't isolate. Shame grows in secrecy.</BodyText>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "hsl(var(--primary))", textAlign: "left", marginBottom: "16px" }}>
                Text someone in your brotherhood:
              </p>
              <Declaration text="I fell tonight. Not spiraling, just being honest. I'm still in the fight." />
              <TeachingText
                regular="You don't need a long conversation."
                gold="You need to break isolation."
              />

              <button
                onClick={() => setBrotherhoodCommitted(!brotherhoodCommitted)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  background: brotherhoodCommitted ? "rgba(184,150,63,0.1)" : "#242424",
                  border: "none",
                  borderLeft: brotherhoodCommitted ? "3px solid hsl(var(--primary))" : "3px solid transparent",
                  borderRadius: brotherhoodCommitted ? "0 12px 12px 0" : "12px",
                  padding: "16px 20px",
                  marginBottom: "24px",
                  cursor: "pointer",
                  outline: "none",
                  boxShadow: "none",
                }}
              >
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  border: `2px solid hsl(var(--primary))`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  background: brotherhoodCommitted ? "hsl(var(--primary))" : "transparent",
                  transition: "background 0.2s",
                }}>
                  {brotherhoodCommitted && <Check style={{ width: 16, height: 16, color: "#1A1A1A" }} />}
                </div>
                <span style={{ color: "#F5F3EE", fontSize: "14px", fontWeight: 500, textAlign: "left" }}>
                  I commit to reach out to a brother
                </span>
              </button>

              <ContinueButton onClick={next} disabled={!brotherhoodCommitted} />
            </StepWrapper>
          )}

          {/* STEP 5: RESUME NORMAL RHYTHMS */}
          {step === 4 && (
            <StepWrapper key="r2">
              <Heading>Resume Normal Rhythms</Heading>
              <Subtitle>{stepSubtitles[4]}</Subtitle>
              <BodyText>Don't punish yourself. Don't try to earn back your standing through extra disciplines.</BodyText>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "hsl(var(--primary))", textAlign: "left", marginBottom: "12px" }}>
                Return to normal:
              </p>
              <BulletList items={[
                "Go to bed at your normal time",
                "Wake up tomorrow as a son, not a failure",
                "Continue your daily practices without shame-driven intensity",
              ]} />
              <TeachingText
                regular="The goal is return,"
                gold="not self-punishment."
              />

              <button
                onClick={() => setRhythmsCommitted(!rhythmsCommitted)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  background: rhythmsCommitted ? "rgba(184,150,63,0.1)" : "#242424",
                  border: "none",
                  borderLeft: rhythmsCommitted ? "3px solid hsl(var(--primary))" : "3px solid transparent",
                  borderRadius: rhythmsCommitted ? "0 12px 12px 0" : "12px",
                  padding: "16px 20px",
                  marginBottom: "24px",
                  cursor: "pointer",
                  outline: "none",
                  boxShadow: "none",
                }}
              >
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  border: `2px solid hsl(var(--primary))`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  background: rhythmsCommitted ? "hsl(var(--primary))" : "transparent",
                  transition: "background 0.2s",
                }}>
                  {rhythmsCommitted && <Check style={{ width: 16, height: 16, color: "#1A1A1A" }} />}
                </div>
                <span style={{ color: "#F5F3EE", fontSize: "14px", fontWeight: 500, textAlign: "left" }}>
                  I commit to return to normal rhythms, not self-punishment
                </span>
              </button>

              <ContinueButton onClick={next} disabled={!rhythmsCommitted} />
            </StepWrapper>
          )}

          {/* STEP 6: NAVIGATE FORWARD */}
          {step === 5 && (
            <StepWrapper key="n">
              <Heading>Navigate Forward</Heading>
              <Subtitle>{stepSubtitles[5]}</Subtitle>
              <BodyText>After the shame has settled, reflect:</BodyText>
              <BulletList items={[
                "What pattern am I noticing?",
                "What trigger did I miss?",
                "What new practice or boundary might help?",
                "What do I need to bring to my next group call?",
              ]} />
              <TeachingText
                regular="Failure is feedback."
                gold="Use it."
              />
              <button
                onClick={handleComplete}
                disabled={resetStreak.isPending || logRelapseEvent.isPending}
                style={{
                  width: "100%",
                  background: "hsl(var(--primary))",
                  color: "#1A1A1A",
                  fontWeight: 600,
                  fontSize: "15px",
                  border: "none",
                  borderRadius: "12px",
                  padding: "16px",
                  cursor: "pointer",
                  outline: "none",
                  boxShadow: "none",
                  fontFamily: sansFont,
                }}
              >
                Complete RETURN
              </button>
            </StepWrapper>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default GraceProtocol;
