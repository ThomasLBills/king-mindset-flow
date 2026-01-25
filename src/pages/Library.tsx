import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ChevronRight, Lock, Check, BookOpen, Play, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const weeks = [
  {
    number: 1,
    title: "Grace",
    theme: "The verdict is settled",
    scripture: "Romans 8:1",
    completed: true,
    unlocked: true,
  },
  {
    number: 2,
    title: "Identity",
    theme: "Sonship: received, not achieved",
    scripture: "Galatians 4:7",
    completed: false,
    unlocked: true,
    current: true,
  },
  {
    number: 3,
    title: "The Mind",
    theme: "Awareness restores choice",
    scripture: "Romans 12:2",
    completed: false,
    unlocked: false,
  },
  {
    number: 4,
    title: "Walking in the Spirit",
    theme: "Dependence over self-effort",
    scripture: "Galatians 5:16",
    completed: false,
    unlocked: false,
  },
  {
    number: 5,
    title: "Temptation",
    theme: "The way out",
    scripture: "1 Corinthians 10:13",
    completed: false,
    unlocked: false,
  },
  {
    number: 6,
    title: "Structure",
    theme: "Daily rhythms and guardrails",
    scripture: "Ephesians 5:15-16",
    completed: false,
    unlocked: false,
  },
  {
    number: 7,
    title: "Brotherhood",
    theme: "Freedom together",
    scripture: "Galatians 6:2",
    completed: false,
    unlocked: false,
  },
  {
    number: 8,
    title: "Purpose",
    theme: "Free for something",
    scripture: "Galatians 5:13",
    completed: false,
    unlocked: false,
  },
];

const declarations = [
  "I am a beloved son of God.",
  "The verdict is settled—no condemnation.",
  "My identity is not defined by my struggles.",
  "I have the Spirit's power within me.",
  "I can endure with grace.",
];

const LibraryPage = () => {
  const [activeTab, setActiveTab] = useState<"curriculum" | "cards">("curriculum");
  const [expandedWeek, setExpandedWeek] = useState<number | null>(2);

  return (
    <AppLayout>
      <div className="px-5 py-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="font-serif text-3xl font-bold mb-2">Library</h1>
          <p className="text-muted-foreground">
            Your 8-week journey to freedom
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-6"
        >
          <button
            onClick={() => setActiveTab("curriculum")}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl font-medium transition-all",
              activeTab === "curriculum"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            Curriculum
          </button>
          <button
            onClick={() => setActiveTab("cards")}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl font-medium transition-all",
              activeTab === "cards"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            Quick Cards
          </button>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === "curriculum" && (
            <motion.div
              key="curriculum"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              {weeks.map((week) => (
                <div key={week.number}>
                  <button
                    onClick={() =>
                      week.unlocked &&
                      setExpandedWeek(expandedWeek === week.number ? null : week.number)
                    }
                    disabled={!week.unlocked}
                    className={cn(
                      "w-full p-4 rounded-xl border text-left transition-all",
                      week.current
                        ? "border-primary bg-primary/5"
                        : week.completed
                        ? "border-success/30 bg-success/5"
                        : week.unlocked
                        ? "border-border hover:border-primary/30"
                        : "border-border opacity-50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm",
                          week.completed
                            ? "bg-success text-success-foreground"
                            : week.current
                            ? "bg-primary text-primary-foreground"
                            : week.unlocked
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {week.completed ? (
                          <Check className="w-5 h-5" />
                        ) : week.unlocked ? (
                          week.number
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            Week {week.number}
                          </span>
                          {week.current && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        <h3 className="font-serif font-semibold">{week.title}</h3>
                        <p className="text-sm text-muted-foreground">{week.theme}</p>
                      </div>
                      {week.unlocked && (
                        <ChevronRight
                          className={cn(
                            "w-5 h-5 text-muted-foreground transition-transform",
                            expandedWeek === week.number && "rotate-90"
                          )}
                        />
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedWeek === week.number && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 pl-14 space-y-2">
                          <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-all">
                            <Play className="w-4 h-4" />
                            <span className="text-sm font-medium">Watch Teaching</span>
                          </button>
                          <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-all">
                            <BookOpen className="w-4 h-4" />
                            <span className="text-sm font-medium">Read Content</span>
                          </button>
                          <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-all">
                            <Star className="w-4 h-4" />
                            <span className="text-sm font-medium">Declarations</span>
                          </button>
                          <p className="text-xs text-muted-foreground italic pl-1">
                            {week.scripture}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === "cards" && (
            <motion.div
              key="cards"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="mb-6">
                <h2 className="font-serif text-lg font-semibold mb-3">Declarations</h2>
                <div className="space-y-2">
                  {declarations.map((declaration, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-secondary border border-border"
                    >
                      <p className="font-medium text-sm">{declaration}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="font-serif text-lg font-semibold mb-3">Scripture Cards</h2>
                <div className="grid grid-cols-2 gap-3">
                  {["Pressure", "Temptation", "After Fall", "Fatigue", "Loneliness", "Stress"].map(
                    (type) => (
                      <button
                        key={type}
                        className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all"
                      >
                        <p className="font-medium text-sm">{type}</p>
                        <p className="text-xs text-muted-foreground">3 cards</p>
                      </button>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default LibraryPage;
