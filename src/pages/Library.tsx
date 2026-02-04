import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ChevronRight, Lock, Check, BookOpen, Play, Star, Sparkles, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const weeks = [
  {
    number: 1,
    title: "Grace",
    theme: "The verdict is settled",
    scripture: "Romans 8:1",
    completed: true,
    unlocked: true,
    progress: 100,
  },
  {
    number: 2,
    title: "Identity",
    theme: "Sonship: received, not achieved",
    scripture: "Galatians 4:7",
    completed: false,
    unlocked: true,
    current: true,
    progress: 60,
  },
  {
    number: 3,
    title: "The Mind",
    theme: "Awareness restores choice",
    scripture: "Romans 12:2",
    completed: false,
    unlocked: false,
    progress: 0,
  },
  {
    number: 4,
    title: "Walking in the Spirit",
    theme: "Dependence over self-effort",
    scripture: "Galatians 5:16",
    completed: false,
    unlocked: false,
    progress: 0,
  },
  {
    number: 5,
    title: "Temptation",
    theme: "The way out",
    scripture: "1 Corinthians 10:13",
    completed: false,
    unlocked: false,
    progress: 0,
  },
  {
    number: 6,
    title: "Structure",
    theme: "Daily rhythms and guardrails",
    scripture: "Ephesians 5:15-16",
    completed: false,
    unlocked: false,
    progress: 0,
  },
  {
    number: 7,
    title: "Brotherhood",
    theme: "Freedom together",
    scripture: "Galatians 6:2",
    completed: false,
    unlocked: false,
    progress: 0,
  },
  {
    number: 8,
    title: "Purpose",
    theme: "Free for something",
    scripture: "Galatians 5:13",
    completed: false,
    unlocked: false,
    progress: 0,
  },
];

const declarations = [
  { text: "I am a beloved son of God.", week: 1 },
  { text: "The verdict is settled—no condemnation.", week: 1 },
  { text: "My identity is not defined by my struggles.", week: 2 },
  { text: "I have the Spirit's power within me.", week: 2 },
  { text: "I can endure with grace.", week: 2 },
];

const scriptureCategories = [
  { type: "Pressure", count: 3, color: "bg-primary/10 text-primary" },
  { type: "Temptation", count: 4, color: "bg-warning/10 text-warning" },
  { type: "After Fall", count: 3, color: "bg-success/10 text-success" },
  { type: "Fatigue", count: 2, color: "bg-muted text-muted-foreground" },
  { type: "Loneliness", count: 3, color: "bg-accent/10 text-accent" },
  { type: "Identity", count: 4, color: "bg-primary/10 text-primary" },
];

const LibraryPage = () => {
  const [activeTab, setActiveTab] = useState<"curriculum" | "cards">("curriculum");
  const [expandedWeek, setExpandedWeek] = useState<number | null>(2);

  const completedWeeks = weeks.filter((w) => w.completed).length;
  const overallProgress = Math.round((completedWeeks / weeks.length) * 100);

  return (
    <AppLayout>
      <div className="px-5 py-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm text-muted-foreground">Week 2 of 8</span>
          </div>
          <h1 className="font-serif text-3xl font-bold mb-2">Library</h1>
          <p className="text-muted-foreground">
            Your 8-week journey to freedom
          </p>
        </motion.div>

        {/* Overall Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Journey Progress</span>
            <span className="text-sm text-muted-foreground">{completedWeeks}/8 weeks</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
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
              "flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200",
              activeTab === "curriculum"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            <BookOpen className="w-4 h-4 inline mr-2" />
            Curriculum
          </button>
          <button
            onClick={() => setActiveTab("cards")}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200",
              activeTab === "cards"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            <Star className="w-4 h-4 inline mr-2" />
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
              {weeks.map((week, index) => (
                <motion.div 
                  key={week.number}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <button
                    onClick={() =>
                      week.unlocked &&
                      setExpandedWeek(expandedWeek === week.number ? null : week.number)
                    }
                    disabled={!week.unlocked}
                    className={cn(
                      "week-card",
                      week.current && "current",
                      week.completed && "completed",
                      !week.unlocked && "locked",
                      week.unlocked && !week.current && !week.completed && "unlocked"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "w-11 h-11 rounded-full flex items-center justify-center font-semibold text-sm transition-all",
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
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs text-muted-foreground">
                            Week {week.number}
                          </span>
                          {week.current && (
                            <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-semibold">
                              Current
                            </span>
                          )}
                        </div>
                        <h3 className="font-serif font-semibold text-lg">{week.title}</h3>
                        <p className="text-sm text-muted-foreground">{week.theme}</p>
                        {week.unlocked && week.progress > 0 && week.progress < 100 && (
                          <div className="mt-2">
                            <Progress value={week.progress} className="h-1" />
                          </div>
                        )}
                      </div>
                      {week.unlocked && (
                        <ChevronRight
                          className={cn(
                            "w-5 h-5 text-muted-foreground transition-transform duration-200",
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
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 pl-[60px] space-y-2">
                          <button className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-all group">
                            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              <Play className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 text-left">
                              <span className="text-sm font-medium block">Watch Teaching</span>
                              <span className="text-xs text-muted-foreground">15 min video</span>
                            </div>
                          </button>
                          <button className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-all group">
                            <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                              <Volume2 className="w-4 h-4 text-accent" />
                            </div>
                            <div className="flex-1 text-left">
                              <span className="text-sm font-medium block">Listen to Audio</span>
                              <span className="text-xs text-muted-foreground">12 min audio</span>
                            </div>
                          </button>
                          <button className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-all group">
                            <div className="p-2 rounded-lg bg-success/10 group-hover:bg-success/20 transition-colors">
                              <BookOpen className="w-4 h-4 text-success" />
                            </div>
                            <div className="flex-1 text-left">
                              <span className="text-sm font-medium block">Read Content</span>
                              <span className="text-xs text-muted-foreground">5 min read</span>
                            </div>
                          </button>
                          <button className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-all group">
                            <div className="p-2 rounded-lg bg-warning/10 group-hover:bg-warning/20 transition-colors">
                              <Star className="w-4 h-4 text-warning" />
                            </div>
                            <div className="flex-1 text-left">
                              <span className="text-sm font-medium block">Declarations</span>
                              <span className="text-xs text-muted-foreground">Daily affirmations</span>
                            </div>
                          </button>
                          <p className="text-xs text-muted-foreground italic pl-1 pt-1">
                            Key verse: {week.scripture}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
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
              <div className="mb-8">
                <h2 className="font-serif text-lg font-semibold mb-4">Identity Declarations</h2>
                <div className="space-y-2">
                  {declarations.map((declaration, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-4 rounded-xl bg-card border-2 border-border hover:border-primary/30 transition-all"
                    >
                      <p className="font-medium text-sm">{declaration.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">Week {declaration.week}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="font-serif text-lg font-semibold mb-4">Scripture Cards</h2>
                <div className="grid grid-cols-2 gap-3">
                  {scriptureCategories.map((category, index) => (
                    <motion.button
                      key={category.type}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      className="p-4 rounded-xl bg-card border-2 border-border hover:border-primary/30 hover:shadow-md transition-all text-left"
                    >
                      <div className={cn("inline-flex px-2 py-1 rounded-lg text-xs font-medium mb-2", category.color)}>
                        {category.type}
                      </div>
                      <p className="text-sm text-muted-foreground">{category.count} cards</p>
                    </motion.button>
                  ))}
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
