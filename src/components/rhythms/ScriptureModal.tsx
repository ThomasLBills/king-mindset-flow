import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, Bookmark } from "lucide-react";
import { Scripture } from "@/data/faithContent";

interface ScriptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  scripture: Scripture;
  isCompleted: boolean;
}

const ScriptureModal = ({ open, onOpenChange, onComplete, scripture, isCompleted }: ScriptureModalProps) => {
  const [saved, setSaved] = useState(false);

  const handleComplete = () => {
    onComplete();
    onOpenChange(false);
  };

  const handleSave = () => {
    setSaved(true);
    // Future: persist to saved verses
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-0 bg-gradient-to-b from-card to-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl">
            <BookOpen className="w-5 h-5 text-accent" />
            Today's Truth
          </DialogTitle>
        </DialogHeader>
        
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5 py-4"
          >
            <div className="scripture-card">
              <p className="font-serif text-lg leading-relaxed text-primary-foreground/95 mb-3">
                "{scripture.text}"
              </p>
              <p className="text-sm text-primary-foreground/70 font-medium">
                — {scripture.reference}
              </p>
            </div>
            
            <p className="text-muted-foreground leading-relaxed">
              {scripture.reflection}
            </p>
            
            <button
              onClick={handleSave}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Bookmark className={`w-4 h-4 ${saved ? 'fill-accent text-accent' : ''}`} />
              <span>{saved ? 'Saved' : 'Save this verse'}</span>
            </button>
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col gap-3 pt-2">
          {isCompleted ? (
            <div className="text-center py-3 text-success font-medium">
              ✓ Completed for today
            </div>
          ) : (
            <Button 
              onClick={handleComplete}
              variant="grace"
              size="lg"
              className="w-full"
            >
              I've anchored in truth
            </Button>
          )}
          <Button 
            onClick={() => onOpenChange(false)}
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScriptureModal;
