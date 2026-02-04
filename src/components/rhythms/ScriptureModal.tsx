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

interface ScriptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const verses = [
  {
    reference: "2 Corinthians 5:17",
    text: "Therefore, if anyone is in Christ, he is a new creation. The old has passed away; behold, the new has come.",
    reflection: "Your past does not define your future. In Christ, you are already being made new—not because of your effort, but because of His finished work.",
  },
  {
    reference: "Romans 8:1",
    text: "There is therefore now no condemnation for those who are in Christ Jesus.",
    reflection: "Shame says you are your mistakes. Truth says you are forgiven and free. Today, walk without condemnation.",
  },
  {
    reference: "Galatians 5:1",
    text: "For freedom Christ has set us free; stand firm therefore, and do not submit again to a yoke of slavery.",
    reflection: "Freedom isn't earned—it's received. You're not fighting for freedom; you're fighting from it. Stand firm in what's already yours.",
  },
  {
    reference: "Philippians 4:13",
    text: "I can do all things through him who strengthens me.",
    reflection: "This isn't about willpower. It's about drawing strength from a source greater than yourself. He is your power today.",
  },
  {
    reference: "1 John 3:1",
    text: "See what kind of love the Father has given to us, that we should be called children of God; and so we are.",
    reflection: "You are not just forgiven—you are family. A beloved son. Let that identity shape how you see yourself today.",
  },
];

const ScriptureModal = ({ open, onOpenChange, onComplete }: ScriptureModalProps) => {
  const [currentVerse] = useState(() => 
    verses[Math.floor(Math.random() * verses.length)]
  );
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
                "{currentVerse.text}"
              </p>
              <p className="text-sm text-primary-foreground/70 font-medium">
                — {currentVerse.reference}
              </p>
            </div>
            
            <p className="text-muted-foreground leading-relaxed">
              {currentVerse.reflection}
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
          <Button 
            onClick={handleComplete}
            variant="grace"
            size="lg"
            className="w-full"
          >
            I've anchored in truth
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

export default ScriptureModal;
