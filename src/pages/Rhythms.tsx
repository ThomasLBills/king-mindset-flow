import { useState } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Check, Cross, Heart, Users, DollarSign, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

const pillars = [
  { id: "faith", label: "Faith", icon: Cross, color: "text-primary" },
  { id: "family", label: "Family", icon: Heart, color: "text-warning" },
  { id: "fitness", label: "Fitness", icon: Dumbbell, color: "text-success" },
  { id: "finance", label: "Finance", icon: DollarSign, color: "text-accent" },
];

const rhythmItems = {
  faith: [
    { id: "prayer", label: "Morning prayer", completed: true },
    { id: "scripture", label: "Read scripture", completed: false },
    { id: "gratitude", label: "Gratitude practice", completed: true },
  ],
  family: [
    { id: "present", label: "Be present at dinner", completed: false },
    { id: "connect", label: "Connect with spouse/family", completed: false },
    { id: "serve", label: "Act of service", completed: false },
  ],
  fitness: [
    { id: "movement", label: "30 min movement", completed: true },
    { id: "water", label: "Drink 8 glasses water", completed: true },
    { id: "sleep", label: "7+ hours sleep", completed: false },
  ],
  finance: [
    { id: "review", label: "Review spending", completed: false },
    { id: "save", label: "Transfer to savings", completed: false },
    { id: "give", label: "Plan to give", completed: false },
  ],
};

const RhythmsPage = () => {
  const [activePillar, setActivePillar] = useState<string>("faith");
  const [items, setItems] = useState(rhythmItems);

  const toggleItem = (pillarId: string, itemId: string) => {
    setItems((prev) => ({
      ...prev,
      [pillarId]: prev[pillarId as keyof typeof prev].map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      ),
    }));
  };

  const currentItems = items[activePillar as keyof typeof items];
  const completedCount = currentItems.filter((i) => i.completed).length;

  return (
    <AppLayout>
      <div className="px-5 py-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="font-serif text-3xl font-bold mb-2">Daily Rhythms</h1>
          <p className="text-muted-foreground">
            Small, consistent actions build lasting freedom
          </p>
        </motion.div>

        {/* Four Pillars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-4 gap-2 mb-6"
        >
          {pillars.map((pillar) => {
            const pillarItems = items[pillar.id as keyof typeof items];
            const done = pillarItems.filter((i) => i.completed).length;
            const total = pillarItems.length;
            const isActive = activePillar === pillar.id;

            return (
              <button
                key={pillar.id}
                onClick={() => setActivePillar(pillar.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border hover:border-primary/30"
                )}
              >
                <pillar.icon
                  className={cn("w-5 h-5", isActive ? "text-current" : pillar.color)}
                />
                <span className="text-xs font-medium">{pillar.label}</span>
                <span className="text-xs opacity-70">
                  {done}/{total}
                </span>
              </button>
            );
          })}
        </motion.div>

        {/* Active Pillar Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-elevated p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-semibold capitalize">
              {activePillar} Rhythms
            </h2>
            <span className="text-sm text-muted-foreground">
              {completedCount}/{currentItems.length} today
            </span>
          </div>

          <div className="space-y-3">
            {currentItems.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleItem(activePillar, item.id)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                  item.completed
                    ? "border-success/30 bg-success/5"
                    : "border-border hover:border-primary/30"
                )}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                    item.completed
                      ? "border-success bg-success"
                      : "border-muted-foreground"
                  )}
                >
                  {item.completed && <Check className="w-4 h-4 text-success-foreground" />}
                </div>
                <span
                  className={cn(
                    "font-medium transition-colors",
                    item.completed && "text-muted-foreground line-through"
                  )}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Digital Wisdom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <h2 className="font-serif text-xl font-semibold mb-4">Digital Wisdom</h2>
          <div className="space-y-3">
            <div className="safe-zone flex items-center justify-between">
              <div>
                <p className="font-medium">Phone-free hours</p>
                <p className="text-sm text-muted-foreground">9 PM - 7 AM</p>
              </div>
              <div className="px-3 py-1 bg-success/20 text-success rounded-full text-sm font-medium">
                Active
              </div>
            </div>
            <div className="safe-zone flex items-center justify-between">
              <div>
                <p className="font-medium">Bedtime boundary</p>
                <p className="text-sm text-muted-foreground">Device out of bedroom</p>
              </div>
              <div className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm font-medium">
                Set up
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default RhythmsPage;
