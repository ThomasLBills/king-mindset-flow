import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, Volume2 } from "lucide-react";
import { Prayer } from "@/data/faithContent";

interface PrayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  prayer: Prayer;
  isCompleted: boolean;
}

const PrayerModal = ({ open, onOpenChange, onComplete, prayer, isCompleted }: PrayerModalProps) => {
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
            {prayer.title}
          </DialogTitle>
        </DialogHeader>
        
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="py-4"
          >
            <p className="font-serif text-lg leading-relaxed text-foreground/90">
              {prayer.text}
            </p>
          </motion.div>
        </AnimatePresence>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Volume2 className="w-4 h-4" />
              <span>Audio coming soon</span>
            </div>
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
              I've prayed
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

export default PrayerModal;
