import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Eye, 
  MessageCircle, 
  ArrowRight, 
  Check, 
  Users,
  X,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { id: "notice", title: "Notice", icon: Eye, description: "What's happening right now?" },
  { id: "name", title: "Name Truth", icon: MessageCircle, description: "Who you really are" },
  { id: "redirect", title: "Redirect", icon: ArrowRight, description: "Your next right action" },
];

const bodyAwareness = [
  "Tension in chest",
  "Restless energy",
  "Racing thoughts",
  "Shallow breathing",
  "Fatigue",
  "Numbness",
];

const emotions = [
  "Stressed",
  "Lonely",
  "Bored",
  "Anxious",
  "Angry",
  "Rejected",
  "Overwhelmed",
  "Empty",
];

const truthStatements = [
  "I am a beloved son, not defined by my struggles.",
  "This urge is temporary. It will pass.",
  "I have the Spirit's power within me.",
  "My identity is secure, no matter what I feel.",
  "I can endure this moment with grace.",
];

const redirectActions = [
  { label: "Take 5 deep breaths", time: "30 sec" },
  { label: "Do 20 pushups", time: "1 min" },
  { label: "Step outside briefly", time: "2 min" },
  { label: "Cold water on face", time: "30 sec" },
  { label: "Text a brother", time: "1 min" },
  { label: "Read a scripture card", time: "1 min" },
];

interface PressureRisingToolProps {
  onClose: () => void;
  onReachOut: () => void;
}

const PressureRisingTool = ({ onClose, onReachOut }: PressureRisingToolProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedBody, setSelectedBody] = useState<string[]>([]);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [selectedTruth, setSelectedTruth] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleComplete = () => {
    setCompleted(true);
  };

  const toggleItem = (item: string, list: string[], setter: (val: string[]) => void) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  if (completed) {
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
          <Check className="w-10 h-10 text-success-foreground" />
        </motion.div>
        <h2 className="font-serif text-3xl font-bold mb-2 text-center">You did it</h2>
        <p className="text-muted-foreground text-center mb-8 max-w-xs">
          You noticed. You named truth. You redirected. That's a victory.
        </p>
        <p className="scripture-text text-center mb-8">
          "The one who is in you is greater than the one who is in the world."
          <span className="block text-xs mt-1 not-italic">— 1 John 4:4</span>
        </p>
        <Button variant="tool" size="lg" onClick={onClose}>
          Return Home
        </Button>
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
        <div className="flex gap-2">
          {steps.map((step, i) => (
            <div
              key={step.id}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-colors",
                i === currentStep ? "bg-primary" : i < currentStep ? "bg-success" : "bg-muted"
              )}
            />
          ))}
        </div>
        <div className="w-9" />
      </div>

      {/* Step Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          {currentStep > 0 && (
            <button onClick={() => setCurrentStep(currentStep - 1)} className="p-1">
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
          <div className="flex items-center gap-2">
            {(() => {
              const StepIcon = steps[currentStep].icon;
              return <StepIcon className="w-5 h-5 text-primary" />;
            })()}
            <span className="text-sm text-muted-foreground uppercase tracking-wide">
              Step {currentStep + 1}
            </span>
          </div>
        </div>
        <h2 className="font-serif text-2xl font-bold">{steps[currentStep].title}</h2>
        <p className="text-muted-foreground">{steps[currentStep].description}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div
              key="notice"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <p className="text-sm font-medium mb-3">What's happening in your body?</p>
                <div className="flex flex-wrap gap-2">
                  {bodyAwareness.map((item) => (
                    <button
                      key={item}
                      onClick={() => toggleItem(item, selectedBody, setSelectedBody)}
                      className={cn(
                        "px-3 py-2 rounded-full text-sm transition-all",
                        selectedBody.includes(item)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      )}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-3">What emotions are present?</p>
                <div className="flex flex-wrap gap-2">
                  {emotions.map((item) => (
                    <button
                      key={item}
                      onClick={() => toggleItem(item, selectedEmotions, setSelectedEmotions)}
                      className={cn(
                        "px-3 py-2 rounded-full text-sm transition-all",
                        selectedEmotions.includes(item)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      )}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="safe-zone">
                <p className="text-sm font-medium mb-2">You're doing it.</p>
                <p className="text-sm text-muted-foreground">
                  Awareness restores choice. Just by noticing, you've already created space.
                </p>
              </div>
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div
              key="name"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground mb-4">
                Select a truth to anchor yourself:
              </p>
              {truthStatements.map((truth) => (
                <button
                  key={truth}
                  onClick={() => setSelectedTruth(truth)}
                  className={cn(
                    "w-full p-4 rounded-xl text-left transition-all border",
                    selectedTruth === truth
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <p className="font-medium">{truth}</p>
                </button>
              ))}
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="redirect"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground mb-4">
                Choose a 90-second action to redirect:
              </p>
              <div className="grid gap-3">
                {redirectActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={handleComplete}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-all"
                  >
                    <span className="font-medium">{action.label}</span>
                    <span className="text-sm text-muted-foreground">{action.time}</span>
                  </button>
                ))}
              </div>

              <div className="pt-4">
                <Button variant="brotherhood" onClick={onReachOut} className="w-full">
                  <Users className="w-4 h-4" />
                  Reach out to a brother
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {currentStep < 2 && (
        <div className="p-6 border-t border-border">
          <Button
            variant="tool"
            size="lg"
            onClick={handleNext}
            disabled={
              (currentStep === 0 && selectedBody.length === 0 && selectedEmotions.length === 0) ||
              (currentStep === 1 && !selectedTruth)
            }
            className="w-full"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default PressureRisingTool;
