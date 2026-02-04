import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, Volume2 } from "lucide-react";

interface PrayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const prayers = [
  {
    title: "Morning Surrender",
    text: "Father, I come to You not because I'm strong, but because You are. Today, I surrender my thoughts, my desires, and my weaknesses into Your hands. I am Your son—not defined by my failures, but by Your love. Lead me in freedom today.",
  },
  {
    title: "Identity Reset",
    text: "Lord, remind me who I am. Not what I've done, not what I feel, but who You say I am. I am chosen. I am loved. I am being made new. Help me walk in that truth today, one moment at a time.",
  },
  {
    title: "Strength in Weakness",
    text: "God, I don't have what it takes on my own—and that's okay. Your power is made perfect in my weakness. I invite Your Spirit to fill the places where I am empty. I trust You more than I trust my urges.",
  },
];

const PrayerModal = ({ open, onOpenChange, onComplete }: PrayerModalProps) => {
  const [currentPrayer] = useState(() => 
    prayers[Math.floor(Math.random() * prayers.length)]
  );

  const handleComplete = () => {
    onComplete();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-0 bg-gradient-to-b from-card to-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl">
            <Heart className="w-5 h-5 text-primary" />
            {currentPrayer.title}
          </DialogTitle>
        </DialogHeader>
        
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 py-4"
          >
            <p className="font-serif text-lg leading-relaxed text-foreground/90">
              {currentPrayer.text}
            </p>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Volume2 className="w-4 h-4" />
              <span>Audio coming soon</span>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col gap-3 pt-2">
          <Button 
            onClick={handleComplete}
            variant="grace"
            size="lg"
            className="w-full"
          >
            I've prayed
          </Button>
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

export default PrayerModal;
