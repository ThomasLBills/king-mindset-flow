import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Brain, MessageCircle, Footprints, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { commonThoughts, getDailyTruth } from "@/data/faithContent";

interface RenewedMindModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  isCompleted: boolean;
  dayIndex: number; // Used to select consistent truth for the day
}

type Step = "identify" | "evaluate" | "replace" | "action";

const actionOptions = [
  { id: "pray", label: "Pray", icon: MessageCircle },
  { id: "move", label: "Move", icon: Footprints },
  { id: "text", label: "Text a brother", icon: Phone },
];

const RenewedMindModal = ({ open, onOpenChange, onComplete, isCompleted, dayIndex }: RenewedMindModalProps) => {
  const [step, setStep] = useState<Step>("identify");
  const [selectedThought, setSelectedThought] = useState<string | null>(null);
  const [customThought, setCustomThought] = useState("");
  const [evaluation, setEvaluation] = useState<"lie" | "truth" | null>(null);

  const handleReset = () => {
    setStep("identify");
    setSelectedThought(null);
    setCustomThought("");
    setEvaluation(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(handleReset, 300);
  };

  const handleComplete = () => {
    onComplete();
    handleClose();
  };

  const handleThoughtSelect = (thoughtId: string) => {
    setSelectedThought(thoughtId);
    setStep("evaluate");
  };

  const handleCustomSubmit = () => {
    if (customThought.trim()) {
      setSelectedThought("custom");
      setStep("evaluate");
    }
  };

  const handleEvaluation = (value: "lie" | "truth") => {
    setEvaluation(value);
    setStep("replace");
  };

  const getCurrentTruth = () => {
    const thoughtId = selectedThought || "custom";
    return getDailyTruth(thoughtId, dayIndex);
  };

  const getSelectedLabel = () => {
    if (selectedThought === "custom") return customThought;
    return commonThoughts.find(t => t.id === selectedThought)?.label || "";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md border-0 bg-gradient-to-b from-card to-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl">
            <Brain className="w-5 h-5 text-warning" />
            Renewed Mind
          </DialogTitle>
        </DialogHeader>
        
        {isCompleted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-5 py-4 text-center"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-success/20 flex items-center justify-center">
              <Brain className="w-8 h-8 text-success" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-serif text-xl font-semibold">Completed for Today</h3>
              <p className="text-muted-foreground">
                Your mind has been renewed. Walk in freedom.
              </p>
            </div>
            
            <Button 
              onClick={handleClose}
              variant="ghost"
              className="text-muted-foreground"
            >
              Close
            </Button>
          </motion.div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              {step === "identify" && (
                <motion.div
                  key="identify"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4 py-4"
                >
                  <p className="text-muted-foreground">
                    What thought has been loud today?
                  </p>
                  
                  <div className="space-y-2">
                    {commonThoughts.map((thought) => (
                      <button
                        key={thought.id}
                        onClick={() => handleThoughtSelect(thought.id)}
                        className="w-full text-left px-4 py-3 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-primary/30 transition-all"
                      >
                        "{thought.label}"
                      </button>
                    ))}
                  </div>
                  
                  <div className="pt-2">
                    <input
                      type="text"
                      value={customThought}
                      onChange={(e) => setCustomThought(e.target.value)}
                      placeholder="Or write your own..."
                      className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 focus:border-primary/50 focus:outline-none transition-colors"
                    />
                    {customThought.trim() && (
                      <Button
                        onClick={handleCustomSubmit}
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                      >
                        Continue with this thought →
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}

              {step === "evaluate" && (
                <motion.div
                  key="evaluate"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5 py-4"
                >
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                    <p className="text-sm text-muted-foreground mb-1">The thought:</p>
                    <p className="font-medium">"{getSelectedLabel()}"</p>
                  </div>
                  
                  <p className="text-muted-foreground">
                    Is this aligned with truth?
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => handleEvaluation("lie")}
                      variant="outline"
                      size="lg"
                      className={cn(
                        "border-2 transition-all",
                        evaluation === "lie" && "border-destructive bg-destructive/10"
                      )}
                    >
                      It's a Lie
                    </Button>
                    <Button
                      onClick={() => handleEvaluation("truth")}
                      variant="outline"
                      size="lg"
                      className={cn(
                        "border-2 transition-all",
                        evaluation === "truth" && "border-success bg-success/10"
                      )}
                    >
                      It's Truth
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === "replace" && (
                <motion.div
                  key="replace"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5 py-4"
                >
                  {evaluation === "lie" ? (
                    <>
                      <p className="text-muted-foreground">
                        Replace it with truth:
                      </p>
                      
                      <div className="scripture-card">
                        <p className="font-serif text-lg leading-relaxed text-primary-foreground/95">
                          "{getCurrentTruth()}"
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-muted-foreground">
                        Good recognition. Hold onto this truth:
                      </p>
                      
                      <div className="p-4 rounded-xl bg-success/10 border border-success/30">
                        <p className="font-medium text-success-foreground">
                          You're learning to discern truth from lies. That awareness is growth.
                        </p>
                      </div>
                    </>
                  )}
                  
                  <div className="space-y-3 pt-2">
                    <p className="text-sm text-muted-foreground">
                      Choose an alignment action:
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {actionOptions.map((action) => (
                        <button
                          key={action.id}
                          onClick={() => setStep("action")}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-primary/30 transition-all"
                        >
                          <action.icon className="w-5 h-5 text-primary" />
                          <span className="text-xs font-medium">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleComplete}
                    variant="grace"
                    size="lg"
                    className="w-full mt-4"
                  >
                    My mind is renewed
                  </Button>
                </motion.div>
              )}

              {step === "action" && (
                <motion.div
                  key="action"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-5 py-4 text-center"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-success/20 flex items-center justify-center">
                    <Brain className="w-8 h-8 text-success" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-serif text-xl font-semibold">Mind Renewed</h3>
                    <p className="text-muted-foreground">
                      You've replaced the lie with truth. Walk in freedom today.
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleComplete}
                    variant="grace"
                    size="lg"
                    className="w-full"
                  >
                    Complete
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {step !== "action" && (
              <Button 
                onClick={handleClose}
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
              >
                Close
              </Button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RenewedMindModal;
