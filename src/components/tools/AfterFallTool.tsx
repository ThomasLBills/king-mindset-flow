import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, Check, Users, X, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const graceSteps = [
  {
    id: "breathe",
    title: "Breathe",
    description: "Take three slow, deep breaths. You are still held.",
    action: "I took a breath",
  },
  {
    id: "truth",
    title: "Remember Truth",
    description: "The verdict is settled. Nothing has changed about who you are.",
    scripture: "There is now no condemnation for those who are in Christ Jesus. — Romans 8:1",
    action: "I received this truth",
  },
  {
    id: "confess",
    title: "Simple Confession",
    description: "Acknowledge what happened without spiraling. God already knows.",
    action: "I confessed simply",
  },
  {
    id: "next",
    title: "Do the Next Right Thing",
    description: "One small step forward. Not twenty. Just one.",
    action: "I'm ready to move forward",
  },
];

const nextRightThings = [
  "Take a walk outside",
  "Drink a glass of water",
  "Text a brother (no details needed)",
  "Read a grace card",
  "Do something kind for someone",
  "Clean one small area",
];

interface AfterFallToolProps {
  onClose: () => void;
  onReachOut: () => void;
}

const AfterFallTool = ({ onClose, onReachOut }: AfterFallToolProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const navigate = useNavigate();

  const markComplete = (stepId: string) => {
    setCompletedSteps([...completedSteps, stepId]);
    if (currentStep < graceSteps.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 500);
    } else {
      setTimeout(() => setShowCompletion(true), 500);
    }
  };

  if (showCompletion) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-success rounded-full flex items-center justify-center mb-6"
        >
          <Sparkles className="w-10 h-10 text-success-foreground" />
        </motion.div>
        <h2 className="font-serif text-3xl font-bold mb-2 text-center">You returned quickly</h2>
        <p className="text-muted-foreground text-center mb-6 max-w-xs">
          That's exactly what grace is for. You are not defined by this moment.
        </p>
        
        <div className="w-full max-w-sm mb-8">
          <p className="text-sm font-medium mb-3 text-center">Your next right thing:</p>
          <div className="space-y-2">
            {nextRightThings.slice(0, 3).map((thing) => (
              <div key={thing} className="p-3 bg-secondary rounded-xl text-center">
                {thing}
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <Button variant="brotherhood" size="lg" onClick={onReachOut} className="w-full">
            <Users className="w-4 h-4" />
            Check in with a brother
          </Button>
          <Button variant="calm" size="lg" onClick={() => { onClose(); navigate("/app"); }} className="w-full">
            Return Home
          </Button>
        </div>
      </motion.div>
    );
  }

  const step = graceSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onClose} className="p-2 -ml-2">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-success" />
          <span className="font-medium">Grace Protocol</span>
        </div>
        <div className="w-9" />
      </div>

      {/* Progress */}
      <div className="flex gap-2 p-4">
        {graceSteps.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              "flex-1 h-1.5 rounded-full transition-colors",
              completedSteps.includes(s.id)
                ? "bg-success"
                : i === currentStep
                ? "bg-primary"
                : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl font-serif font-bold text-success">{currentStep + 1}</span>
            </div>
            
            <h2 className="font-serif text-3xl font-bold mb-4">{step.title}</h2>
            <p className="text-lg text-muted-foreground mb-6 max-w-xs mx-auto">
              {step.description}
            </p>

            {step.scripture && (
              <div className="bg-secondary/50 rounded-xl p-4 mb-6 mx-auto max-w-sm">
                <p className="scripture-text text-sm">{step.scripture}</p>
              </div>
            )}

            <Button
              variant="grace"
              size="lg"
              onClick={() => markComplete(step.id)}
              className="min-w-48"
            >
              {completedSteps.includes(step.id) ? (
                <>
                  <Check className="w-4 h-4" />
                  Done
                </>
              ) : (
                <>
                  {step.action}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Encouragement */}
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground">
          You're doing the brave thing by not running from grace.
        </p>
      </div>
    </div>
  );
};

export default AfterFallTool;
