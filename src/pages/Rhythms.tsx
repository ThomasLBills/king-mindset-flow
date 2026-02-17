import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { Check, Cross, Users, Dumbbell, Sparkles, BookOpen, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import FaithSection from "@/components/rhythms/FaithSection";
import { useDailyCompletions } from "@/hooks/useDailyProgress";
import { useUserEnrollment, useEnroll } from "@/hooks/useCurriculum";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
const pillars = [{
  id: "faith",
  label: "Faith",
  subtitle: "",
  icon: Cross,
  color: "text-primary",
  bgColor: "bg-primary/10"
}, {
  id: "connection",
  label: "Connection",
  subtitle: "Move toward people, not isolation",
  icon: Users,
  color: "text-warning",
  bgColor: "bg-warning/10"
}, {
  id: "fitness",
  label: "Fitness",
  subtitle: "",
  icon: Dumbbell,
  color: "text-success",
  bgColor: "bg-success/10"
}];

const rhythmItemDefs = {
  connection: [
    { id: "presence", label: "Be Present", description: "Phone down. Be here." },
    { id: "connect", label: "Connect Intentionally", description: "One meaningful conversation" },
    { id: "service", label: "Act of Service", description: "Love in action" },
  ],
  fitness: [
    { id: "movement", label: "30 min movement", description: "Any form of exercise" },
    { id: "water", label: "Drink 8 glasses water", description: "Stay hydrated" },
    { id: "sleep", label: "7+ hours sleep", description: "Rest is restoration" },
  ],
};

const digitalWisdomDefs = [
  { id: "phone-free", label: "Phone-free hours", description: "9 PM to 7 AM" },
  { id: "bedtime", label: "Bedtime boundary", description: "Device out of bedroom" },
  { id: "social-limit", label: "Social media limit", description: "30 min daily max" },
];

const faithItemIds = ["prayer", "scripture", "renewed-mind"];
const connectionItemIds = rhythmItemDefs.connection.map(i => i.id);
const fitnessItemIds = rhythmItemDefs.fitness.map(i => i.id);
const digitalWisdomItemIds = digitalWisdomDefs.map(i => i.id);

const RhythmsPage = () => {
  const navigate = useNavigate();
  const { data: enrollment, isLoading: enrollLoading } = useUserEnrollment();
  const enroll = useEnroll();

  const [activePillar, setActivePillar] = useState<string>("faith");
  const [faithProgress, setFaithProgress] = useState({ completed: 0, total: 3 });

  // DB-backed completions for each category
  const connectionCompletions = useDailyCompletions("connection", connectionItemIds);
  const fitnessCompletions = useDailyCompletions("fitness", fitnessItemIds);
  const digitalWisdomCompletions = useDailyCompletions("digital_wisdom", digitalWisdomItemIds);

  const handleFaithProgressChange = useCallback((completed: number, total: number) => {
    setFaithProgress({ completed, total });
  }, []);

  const getCompletionsHook = (pillarId: string) => {
    if (pillarId === "connection") return connectionCompletions;
    if (pillarId === "fitness") return fitnessCompletions;
    return null;
  };

  const getPillarProgress = (pillarId: string) => {
    if (pillarId === "faith") return faithProgress;
    const hook = getCompletionsHook(pillarId);
    if (!hook) return { completed: 0, total: 0 };
    return { completed: hook.completedCount, total: hook.totalItems };
  };

  const totalCompleted = faithProgress.completed + connectionCompletions.completedCount + fitnessCompletions.completedCount;
  const totalItems = faithProgress.total + connectionCompletions.totalItems + fitnessCompletions.totalItems;
  const overallProgress = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;

  const activePillarData = pillars.find(p => p.id === activePillar);
  const activeHook = getCompletionsHook(activePillar);
  const currentItemDefs = activePillar !== "faith" ? rhythmItemDefs[activePillar as keyof typeof rhythmItemDefs] : null;

  return (
    <AppLayout>
      <div className="px-5 py-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm text-muted-foreground">{overallProgress}% complete today</span>
          </div>
          <h1 className="font-serif text-3xl font-bold mb-2">Three Pillars</h1>
          <p className="text-muted-foreground">Small, consistent actions build lasting freedom</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
          <Progress value={overallProgress} className="h-2" />
        </motion.div>

        {/* Enrollment Prompt */}
        {!enrollLoading && !enrollment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mb-6 card-elevated p-5 border-2 border-primary/30"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold">8-Week Journey</h3>
                <p className="text-sm text-muted-foreground">Begin the curriculum that transforms Kings</p>
              </div>
            </div>
            <Button
              onClick={async () => {
                await enroll.mutateAsync();
                navigate("/library");
              }}
              disabled={enroll.isPending}
              className="w-full bg-primary text-primary-foreground font-semibold rounded-xl h-11"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Begin Your Journey
            </Button>
          </motion.div>
        )}

        {enrollment && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/library")}
            className="mb-6 card-elevated p-4 w-full text-left flex items-center gap-3"
          >
            <div className="p-2 rounded-xl bg-primary/10">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-serif font-semibold">Continue Your Journey</p>
              <p className="text-sm text-muted-foreground">Pick up where you left off</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </motion.button>
        )}

        {/* Three Pillars */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-3 mb-6">
          {pillars.map((pillar, index) => {
            const { completed: done, total } = getPillarProgress(pillar.id);
            const isActive = activePillar === pillar.id;
            const isComplete = done === total && total > 0;
            const hasSubtitle = !!pillar.subtitle;
            return (
              <motion.button key={pillar.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + index * 0.05 }} onClick={() => setActivePillar(pillar.id)} className={cn("pillar-card", isActive && "active")}>
                {!hasSubtitle && (
                  <div className={cn("p-2.5 rounded-xl transition-colors", isActive ? "bg-primary-foreground/20" : pillar.bgColor)}>
                    <pillar.icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : pillar.color)} />
                  </div>
                )}
                <div className={cn("flex flex-col items-center", hasSubtitle ? "gap-1" : "gap-0.5")}>
                  <span className={cn("font-bold tracking-tight", hasSubtitle ? "text-base" : "text-sm")}>{pillar.label}</span>
                  {pillar.subtitle && (
                    <span className={cn("text-[9px] leading-tight text-center max-w-[72px]", isActive ? "text-primary-foreground/70" : "text-muted-foreground")}>
                      {pillar.subtitle}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {isComplete ? <Check className="w-3.5 h-3.5 text-success" /> : (
                    <span className={cn("text-[10px] font-medium", isActive ? "text-primary-foreground/70" : "opacity-70")}>
                      {done}/{total}
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Active Pillar Items */}
        <AnimatePresence mode="wait">
          {activePillar === "faith" ? (
            <motion.div key="faith" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="mb-6">
              <FaithSection onProgressChange={handleFaithProgressChange} />
            </motion.div>
          ) : currentItemDefs && activeHook ? (
            <motion.div key={activePillar} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="card-elevated p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {activePillarData && (
                    <div className={cn("p-2 rounded-xl", activePillarData.bgColor)}>
                      <activePillarData.icon className={cn("w-5 h-5", activePillarData.color)} />
                    </div>
                  )}
                  <div>
                    <h2 className="font-serif text-xl font-semibold">{activePillarData?.label}</h2>
                    {activePillarData?.subtitle && (
                      <p className="text-sm text-muted-foreground">{activePillarData.subtitle}</p>
                    )}
                  </div>
                </div>
                <span className={cn("text-sm font-medium px-2 py-1 rounded-full", activeHook.completedCount === activeHook.totalItems ? "bg-success/20 text-success" : "text-muted-foreground")}>
                  {activeHook.completedCount}/{activeHook.totalItems}
                </span>
              </div>

              <div className="space-y-2">
                {currentItemDefs.map((item, index) => {
                  const completed = activeHook.isCompleted(item.id);
                  return (
                    <motion.button key={item.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} onClick={() => activeHook.toggleCompletion.mutate(item.id)} className={cn("checklist-item", completed && "completed")}>
                      <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200", completed ? "border-success bg-success scale-110" : "border-muted-foreground/40")}>
                        {completed && <Check className="w-4 h-4 text-success-foreground" />}
                      </div>
                      <div className="flex-1 text-left">
                        <span className={cn("font-medium block transition-colors", completed && "text-muted-foreground line-through")}>
                          {item.label}
                        </span>
                        <span className="text-xs text-muted-foreground">{item.description}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Digital Wisdom */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="font-serif text-xl font-semibold mb-4">Digital Wisdom</h2>
          <div className="space-y-3">
            {digitalWisdomDefs.map(item => {
              const active = digitalWisdomCompletions.isCompleted(item.id);
              return (
                <button key={item.id} onClick={() => digitalWisdomCompletions.toggleCompletion.mutate(item.id)} className={cn("w-full flex items-center justify-between p-4 rounded-xl transition-all", active ? "safe-zone" : "bg-secondary/50 border border-border hover:border-success/30")}>
                  <div className="text-left">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <div className={cn("px-3 py-1 rounded-full text-sm font-medium transition-colors", active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground")}>
                    {active ? "Active" : "Set up"}
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Encouragement */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-6">
          <div className="scripture-card">
            <p className="font-serif text-lg text-primary-foreground/90 leading-relaxed mb-2">
              "Be very careful, then, how you live—not as unwise but as wise, making the most of every opportunity."
            </p>
            <p className="text-sm text-primary-foreground/60">Ephesians 5:15-16</p>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default RhythmsPage;
