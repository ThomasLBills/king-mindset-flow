import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Check, 
  Users, 
  X, 
  Wind,
  Footprints,
  MapPin,
  Lock,
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const wayOutSteps = [
  {
    id: "breathe",
    icon: Wind,
    title: "Breathe",
    description: "5 slow breaths. This moment will pass.",
    duration: "30 seconds",
  },
  {
    id: "move",
    icon: Footprints,
    title: "Move your body",
    description: "Stand up. Walk. Do jumping jacks. Break the stillness.",
    duration: "60 seconds",
  },
  {
    id: "environment",
    icon: MapPin,
    title: "Change your environment",
    description: "Go to a different room. Step outside. Change what you see.",
    duration: "Now",
  },
  {
    id: "access",
    icon: Lock,
    title: "Reduce access",
    description: "Put the phone in another room. Close the laptop. Create friction.",
    duration: "Now",
  },
  {
    id: "connect",
    icon: MessageCircle,
    title: "Text a brother",
    description: "You don't have to explain. Just say 'Thinking of you' or 'Praying for you.'",
    duration: "30 seconds",
  },
];

interface TemptationToolProps {
  onClose: () => void;
  onReachOut: () => void;
}

const TemptationTool = ({ onClose, onReachOut }: TemptationToolProps) => {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [showVictory, setShowVictory] = useState(false);

  const toggleStep = (stepId: string) => {
    const newCompleted = completedSteps.includes(stepId)
      ? completedSteps.filter((s) => s !== stepId)
      : [...completedSteps, stepId];
    
    setCompletedSteps(newCompleted);
    
    if (newCompleted.length >= 3 && !showVictory) {
      setTimeout(() => setShowVictory(true), 500);
    }
  };

  if (showVictory) {
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
          className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-6"
        >
          <Shield className="w-10 h-10 text-primary-foreground" />
        </motion.div>
        <h2 className="font-serif text-3xl font-bold mb-2 text-center">You endured</h2>
        <p className="text-muted-foreground text-center mb-6 max-w-xs">
          This is what walking in the Spirit looks like. Not perfection—endurance with His power.
        </p>
        
        <p className="scripture-text text-center mb-8 max-w-sm">
          "No temptation has overtaken you except what is common to mankind. And God is faithful; 
          he will not let you be tempted beyond what you can bear."
          <span className="block text-xs mt-2 not-italic">— 1 Corinthians 10:13</span>
        </p>

        <div className="w-full max-w-sm space-y-3">
          <Button variant="tool" size="lg" onClick={onClose} className="w-full">
            Return Home
          </Button>
          <Button variant="calm" size="lg" onClick={onReachOut} className="w-full">
            <Users className="w-4 h-4" />
            Share this win with a brother
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onClose} className="p-2 -ml-2">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-warning" />
          <span className="font-medium">The Way Out</span>
        </div>
        <div className="w-9" />
      </div>

      {/* Intro */}
      <div className="p-6 pb-4">
        <h2 className="font-serif text-2xl font-bold mb-2">You can endure this</h2>
        <p className="text-muted-foreground">
          Complete at least 3 steps. Each one creates distance and strength.
        </p>
        <div className="flex gap-2 mt-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                completedSteps.length >= i
                  ? "bg-success text-success-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {completedSteps.length >= i ? <Check className="w-4 h-4" /> : i}
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="space-y-3">
          <AnimatePresence>
            {wayOutSteps.map((step, index) => (
              <motion.button
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => toggleStep(step.id)}
                className={cn(
                  "w-full p-4 rounded-xl border text-left transition-all",
                  completedSteps.includes(step.id)
                    ? "border-success bg-success/5"
                    : "border-border hover:border-primary/30 hover:bg-muted/50"
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "p-2.5 rounded-xl transition-colors",
                      completedSteps.includes(step.id)
                        ? "bg-success text-success-foreground"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {completedSteps.includes(step.id) ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold">{step.title}</h3>
                      <span className="text-xs text-muted-foreground">{step.duration}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-border">
        <Button variant="brotherhood" size="lg" onClick={onReachOut} className="w-full">
          <Users className="w-4 h-4" />
          I need to talk to someone now
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-3">
          You don't have to fight alone
        </p>
      </div>
    </div>
  );
};

export default TemptationTool;
