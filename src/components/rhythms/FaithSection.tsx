import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Cross, BookOpen, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import PrayerModal from "./PrayerModal";
import ScriptureModal from "./ScriptureModal";
import RenewedMindModal from "./RenewedMindModal";

interface FaithItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
}

interface FaithSectionProps {
  items: FaithItem[];
  onItemComplete: (itemId: string) => void;
}

const FaithSection = ({ items, onItemComplete }: FaithSectionProps) => {
  const [prayerOpen, setPrayerOpen] = useState(false);
  const [scriptureOpen, setScriptureOpen] = useState(false);
  const [renewedMindOpen, setRenewedMindOpen] = useState(false);

  const completedCount = items.filter((i) => i.completed).length;

  const handleItemClick = (itemId: string) => {
    switch (itemId) {
      case "prayer":
        setPrayerOpen(true);
        break;
      case "scripture":
        setScriptureOpen(true);
        break;
      case "renewed-mind":
        setRenewedMindOpen(true);
        break;
    }
  };

  const handleComplete = (itemId: string) => {
    onItemComplete(itemId);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.2 }}
        className="card-elevated p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Cross className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-serif text-xl font-semibold">Faith</h2>
          </div>
          <span
            className={cn(
              "text-sm font-medium px-2 py-1 rounded-full",
              completedCount === items.length
                ? "bg-success/20 text-success"
                : "text-muted-foreground"
            )}
          >
            {completedCount}/{items.length}
          </span>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          2–3 minutes to re-center and anchor in truth
        </p>

        <div className="space-y-2">
          {items.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleItemClick(item.id)}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-200",
                "bg-secondary/30 hover:bg-secondary/50 border border-border/30",
                item.completed && "bg-success/5 border-success/20"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
                  item.completed
                    ? "bg-success/20"
                    : "bg-primary/10"
                )}
              >
                {item.completed ? (
                  <Check className="w-5 h-5 text-success" />
                ) : (
                  <item.icon className={cn("w-5 h-5 text-primary")} />
                )}
              </div>
              <div className="flex-1 text-left">
                <span
                  className={cn(
                    "font-medium block transition-colors",
                    item.completed && "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.description}
                </span>
              </div>
              {!item.completed && (
                <span className="text-xs text-primary/70 font-medium">
                  Tap to start
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <PrayerModal
        open={prayerOpen}
        onOpenChange={setPrayerOpen}
        onComplete={() => handleComplete("prayer")}
      />
      <ScriptureModal
        open={scriptureOpen}
        onOpenChange={setScriptureOpen}
        onComplete={() => handleComplete("scripture")}
      />
      <RenewedMindModal
        open={renewedMindOpen}
        onOpenChange={setRenewedMindOpen}
        onComplete={() => handleComplete("renewed-mind")}
      />
    </>
  );
};

export default FaithSection;
