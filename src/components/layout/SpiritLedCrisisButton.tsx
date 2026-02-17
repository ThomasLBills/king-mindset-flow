import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Phone, BookOpen, HandHeart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const crisisOptions = [
  { id: "tempted", label: "I am feeling tempted" },
  { id: "lonely", label: "I am feeling lonely" },
  { id: "stressed", label: "I am feeling stressed" },
];

const crisisPrayers = [
  "Father, I bring this moment to You. I do not have to be strong on my own. Your Spirit lives in me, and that is enough. I choose to stand. I choose truth over the lie. I choose freedom over escape. Strengthen me now. In Jesus' name, amen.",
  "Lord, right now I feel the pull. But I am not defined by this urge. I am Your son, bought with a price, sealed by Your Spirit. I ask You to flood this moment with Your presence. I do not have to give in. I choose You. In Jesus' name, amen.",
  "God, I am weak right now and I know it. But Your Word says Your power is made perfect in weakness. So I bring my weakness to You and ask You to be my strength. I will not run to what destroys me. I will run to You. In Jesus' name, amen.",
  "Father, the enemy wants me to believe I am alone in this. But You are here. You have not left me. You are not disappointed in me. You are fighting for me. Help me stand for just this moment. That is all I need. In Jesus' name, amen.",
  "Lord Jesus, You were tempted in every way and did not sin. You understand what I feel right now. I ask for the same Spirit that sustained You to sustain me now. I do not have to white-knuckle this. I just have to stay close to You. In Jesus' name, amen.",
  "God, I confess that I want what I should not want right now. But I also want freedom more. Align my desires with Yours. Replace this craving with Your peace. I trust that You are able to keep me from falling. In Jesus' name, amen.",
  "Father, I choose to be honest with You in this moment. I am struggling. But honesty before You is the first step to freedom. I do not hide from You. I run to You. Cover me with grace and carry me through. In Jesus' name, amen.",
  "Lord, I declare that sin has no dominion over me. I am not under law but under grace. The chains are already broken. Help me walk in the freedom that is already mine. I am a new creation. The old has passed away. In Jesus' name, amen.",
];

const getCrisisPrayer = (): string => {
  const index = Math.floor(Math.random() * crisisPrayers.length);
  return crisisPrayers[index];
};

const SpiritLedCrisisButton = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showPrayer, setShowPrayer] = useState(false);
  const [currentPrayer, setCurrentPrayer] = useState("");
  const navigate = useNavigate();

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setStep(0);
      setSelected(null);
      setShowPrayer(false);
    }, 300);
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed z-40 w-14 h-14 rounded-full bg-primary flex items-center justify-center"
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 76px)",
          right: "20px",
          boxShadow: "0 4px 20px hsl(40 44% 54% / 0.4), 0 0 12px hsl(40 44% 54% / 0.2)",
        }}
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05 }}
      >
        <Shield className="w-6 h-6 text-white" />
      </motion.button>

      {/* Full-screen Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[hsl(225_12%_6%)] flex flex-col"
          >
            {/* Close button */}
            <div className="flex justify-end p-4">
              <button onClick={handleClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-white/50" />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center px-6">
              <AnimatePresence mode="wait">
                {/* STEP 1 — NOTICE */}
                {step === 0 && (
                  <motion.div
                    key="notice"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center max-w-sm"
                  >
                    <Shield className="w-12 h-12 text-primary mx-auto mb-6" />
                    <h2 className="font-serif text-3xl font-bold text-white mb-4">
                      Stop. Breathe. You are not alone.
                    </h2>
                    <div className="bg-white/5 border border-primary/20 rounded-xl p-5 mb-8">
                      <p className="font-serif text-sm text-white/80 italic leading-relaxed">
                        "No temptation has overtaken you except what is common to mankind. And God is faithful; he will not let you be tempted beyond what you can bear."
                      </p>
                      <p className="text-xs text-primary mt-3 font-medium">1 Corinthians 10:13</p>
                    </div>
                    <Button
                      onClick={() => setStep(1)}
                      className="w-full rounded-xl font-bold h-12 text-base bg-primary text-[#0A0A0A] hover:bg-primary/90 shadow-lg shadow-primary/20"
                    >
                      Continue
                    </Button>
                  </motion.div>
                )}

                {/* STEP 2 — NAME TRUTH */}
                {step === 1 && (
                  <motion.div
                    key="name"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center max-w-sm w-full"
                  >
                    <h2 className="font-serif text-2xl font-bold text-white mb-6">
                      Name what is happening right now.
                    </h2>
                    <div className="space-y-3 mb-6">
                      {crisisOptions.map((opt) => (
                        <motion.button
                          key={opt.id}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setSelected(opt.id)}
                          className={cn(
                            "w-full p-4 rounded-xl text-left font-medium transition-colors",
                            selected === opt.id
                              ? "bg-primary text-[#0A0A0A]"
                              : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                          )}
                        >
                          {opt.label}
                        </motion.button>
                      ))}
                    </div>
                    <p className="text-sm text-white/50 mb-6 leading-relaxed">
                      You are not what you feel. You are who God says you are.
                    </p>
                    <Button
                      onClick={() => setStep(2)}
                      disabled={!selected}
                      className={cn(
                        "w-full rounded-xl font-bold h-12 text-base transition-all",
                        selected
                          ? "bg-primary text-[#0A0A0A] hover:bg-primary/90 shadow-lg shadow-primary/20"
                          : "bg-white/10 text-white/30"
                      )}
                    >
                      Continue
                    </Button>
                  </motion.div>
                )}

                {/* STEP 3 — REDIRECT */}
                {step === 2 && (
                  <motion.div
                    key="redirect"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center max-w-sm w-full"
                  >
                    <h2 className="font-serif text-2xl font-bold text-white mb-6">
                      Do one of these right now:
                    </h2>
                    <div className="space-y-3 mb-6">
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          window.location.href = "tel:";
                        }}
                        className="w-full p-4 rounded-xl bg-primary text-[#0A0A0A] font-semibold flex items-center gap-3"
                      >
                        <Phone className="w-5 h-5" />
                        Call a brother
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          handleClose();
                          navigate("/library");
                        }}
                        className="w-full p-4 rounded-xl bg-primary text-[#0A0A0A] font-semibold flex items-center gap-3"
                      >
                        <BookOpen className="w-5 h-5" />
                        Read a Rewire card
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { setCurrentPrayer(getCrisisPrayer()); setShowPrayer(true); }}
                        className="w-full p-4 rounded-xl bg-primary text-[#0A0A0A] font-semibold flex items-center gap-3"
                      >
                        <HandHeart className="w-5 h-5" />
                        Pray this out loud
                      </motion.button>
                    </div>

                    {/* Inline Prayer */}
                    <AnimatePresence>
                      {showPrayer && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden mb-4"
                        >
                          <div className="bg-white/5 border border-primary/20 rounded-xl p-5 text-left">
                            <p className="font-serif text-sm text-white/85 italic leading-relaxed">
                              {currentPrayer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      onClick={handleClose}
                      className="text-sm text-white/40 hover:text-white/60 transition-colors py-3"
                    >
                      I am steady. Close.
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SpiritLedCrisisButton;
