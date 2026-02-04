import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { Check, Cross, Heart, DollarSign, Dumbbell, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import FaithSection from "@/components/rhythms/FaithSection";
const pillars = [{
  id: "faith",
  label: "Faith",
  subtitle: "",
  icon: Cross,
  color: "text-primary",
  bgColor: "bg-primary/10"
}, {
  id: "family",
  label: "Connection",
  subtitle: "Move toward people, not isolation",
  icon: Heart,
  color: "text-warning",
  bgColor: "bg-warning/10"
}, {
  id: "fitness",
  label: "Fitness",
  subtitle: "",
  icon: Dumbbell,
  color: "text-success",
  bgColor: "bg-success/10"
}, {
  id: "finance",
  label: "Finance",
  subtitle: "",
  icon: DollarSign,
  color: "text-accent",
  bgColor: "bg-accent/10"
}];
const rhythmItems = {
  family: [{
    id: "present",
    label: "Be present at dinner",
    description: "Phone-free mealtime",
    completed: false
  }, {
    id: "connect",
    label: "Connect with spouse/family",
    description: "Meaningful conversation",
    completed: false
  }, {
    id: "serve",
    label: "Act of service",
    description: "Do something for someone",
    completed: false
  }],
  fitness: [{
    id: "movement",
    label: "30 min movement",
    description: "Any form of exercise",
    completed: false
  }, {
    id: "water",
    label: "Drink 8 glasses water",
    description: "Stay hydrated",
    completed: false
  }, {
    id: "sleep",
    label: "7+ hours sleep",
    description: "Rest is restoration",
    completed: false
  }],
  finance: [{
    id: "review",
    label: "Review spending",
    description: "Quick budget check",
    completed: false
  }, {
    id: "save",
    label: "Transfer to savings",
    description: "Pay yourself first",
    completed: false
  }, {
    id: "give",
    label: "Plan to give",
    description: "Generosity brings freedom",
    completed: false
  }]
};
const digitalWisdomItems = [{
  id: "phone-free",
  label: "Phone-free hours",
  description: "9 PM - 7 AM",
  active: true
}, {
  id: "bedtime",
  label: "Bedtime boundary",
  description: "Device out of bedroom",
  active: false
}, {
  id: "social-limit",
  label: "Social media limit",
  description: "30 min daily max",
  active: false
}];
const RhythmsPage = () => {
  const [activePillar, setActivePillar] = useState<string>("faith");
  const [items, setItems] = useState(rhythmItems);
  const [faithProgress, setFaithProgress] = useState({
    completed: 0,
    total: 3
  });
  const [digitalWisdom, setDigitalWisdom] = useState(digitalWisdomItems);
  const toggleItem = (pillarId: string, itemId: string) => {
    setItems(prev => ({
      ...prev,
      [pillarId]: prev[pillarId as keyof typeof prev].map(item => item.id === itemId ? {
        ...item,
        completed: !item.completed
      } : item)
    }));
  };
  const handleFaithProgressChange = useCallback((completed: number, total: number) => {
    setFaithProgress({
      completed,
      total
    });
  }, []);
  const toggleDigitalWisdom = (itemId: string) => {
    setDigitalWisdom(prev => prev.map(item => item.id === itemId ? {
      ...item,
      active: !item.active
    } : item));
  };
  const currentItems = activePillar === "faith" ? null : items[activePillar as keyof typeof items];
  const completedCount = currentItems ? currentItems.filter(i => i.completed).length : faithProgress.completed;

  // Calculate total progress including faith items
  const otherPillarsCompleted = Object.values(items).reduce((acc, pillar) => acc + pillar.filter(i => i.completed).length, 0);
  const totalPillarsCompleted = faithProgress.completed + otherPillarsCompleted;
  const totalPillarsItems = faithProgress.total + Object.values(items).reduce((acc, pillar) => acc + pillar.length, 0);
  const overallProgress = Math.round(totalPillarsCompleted / totalPillarsItems * 100);
  const activePillarData = pillars.find(p => p.id === activePillar);

  // Get pillar progress for the cards
  const getPillarProgress = (pillarId: string) => {
    if (pillarId === "faith") {
      return {
        done: faithProgress.completed,
        total: faithProgress.total
      };
    }
    const pillarItems = items[pillarId as keyof typeof items];
    return {
      done: pillarItems.filter(i => i.completed).length,
      total: pillarItems.length
    };
  };
  return <AppLayout>
      <div className="px-5 py-6">
        <motion.div initial={{
        opacity: 0,
        y: -10
      }} animate={{
        opacity: 1,
        y: 0
      }} className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm text-muted-foreground">{overallProgress}% complete today</span>
          </div>
          <h1 className="font-serif text-3xl font-bold mb-2">Four Pillars</h1>
          <p className="text-muted-foreground">
            Small, consistent actions build lasting freedom
          </p>
        </motion.div>

        {/* Overall Progress */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.05
      }} className="mb-6">
          <Progress value={overallProgress} className="h-2" />
        </motion.div>

        {/* Four Pillars */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.1
      }} className="grid grid-cols-4 gap-2 mb-6">
          {pillars.map((pillar, index) => {
          const {
            done,
            total
          } = getPillarProgress(pillar.id);
          const isActive = activePillar === pillar.id;
          const isComplete = done === total;
          const hasSubtitle = !!pillar.subtitle;
          return <motion.button key={pillar.id} initial={{
            opacity: 0,
            y: 10
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.1 + index * 0.05
          }} onClick={() => setActivePillar(pillar.id)} className={cn("pillar-card", isActive && "active")}>
                {!hasSubtitle && (
                  <div className={cn("p-2.5 rounded-xl transition-colors", isActive ? "bg-primary-foreground/20" : pillar.bgColor)}>
                    <pillar.icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : pillar.color)} />
                  </div>
                )}
                <div className={cn("flex flex-col items-center", hasSubtitle ? "gap-1" : "gap-0.5")}>
                  <span className={cn(
                    "font-bold tracking-tight",
                    hasSubtitle ? "text-base" : "text-sm"
                  )}>{pillar.label}</span>
                  {pillar.subtitle && (
                    <span className={cn(
                      "text-[9px] leading-tight text-center max-w-[72px]",
                      isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {pillar.subtitle}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {isComplete ? <Check className="w-3.5 h-3.5 text-success" /> : <span className={cn(
                    "text-[10px] font-medium",
                    isActive ? "text-primary-foreground/70" : "opacity-70"
                  )}>
                      {done}/{total}
                    </span>}
                </div>
              </motion.button>;
        })}
        </motion.div>

        {/* Active Pillar Items */}
        <AnimatePresence mode="wait">
          {activePillar === "faith" ? <motion.div key="faith" initial={{
          opacity: 0,
          x: 10
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -10
        }} className="mb-6">
              <FaithSection onProgressChange={handleFaithProgressChange} />
            </motion.div> : <motion.div key={activePillar} initial={{
          opacity: 0,
          x: 10
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -10
        }} transition={{
          duration: 0.2
        }} className="card-elevated p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {activePillarData && <div className={cn("p-1.5 rounded-lg", activePillarData.bgColor)}>
                      <activePillarData.icon className={cn("w-4 h-4", activePillarData.color)} />
                    </div>}
                  <h2 className="font-serif text-xl font-semibold capitalize">
                    {activePillar}
                  </h2>
                </div>
                {currentItems && <span className={cn("text-sm font-medium px-2 py-1 rounded-full", completedCount === currentItems.length ? "bg-success/20 text-success" : "text-muted-foreground")}>
                    {completedCount}/{currentItems.length}
                  </span>}
              </div>

              {currentItems && <div className="space-y-2">
                  {currentItems.map((item, index) => <motion.button key={item.id} initial={{
              opacity: 0,
              y: 5
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: index * 0.05
            }} onClick={() => toggleItem(activePillar, item.id)} className={cn("checklist-item", item.completed && "completed")}>
                      <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200", item.completed ? "border-success bg-success scale-110" : "border-muted-foreground/40")}>
                        {item.completed && <Check className="w-4 h-4 text-success-foreground" />}
                      </div>
                      <div className="flex-1 text-left">
                        <span className={cn("font-medium block transition-colors", item.completed && "text-muted-foreground line-through")}>
                          {item.label}
                        </span>
                        <span className="text-xs text-muted-foreground">{item.description}</span>
                      </div>
                    </motion.button>)}
                </div>}
            </motion.div>}
        </AnimatePresence>

        {/* Digital Wisdom */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.3
      }}>
          <h2 className="font-serif text-xl font-semibold mb-4">Digital Wisdom</h2>
          <div className="space-y-3">
            {digitalWisdom.map(item => <button key={item.id} onClick={() => toggleDigitalWisdom(item.id)} className={cn("w-full flex items-center justify-between p-4 rounded-xl transition-all", item.active ? "safe-zone" : "bg-secondary/50 border border-border hover:border-success/30")}>
                <div className="text-left">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <div className={cn("px-3 py-1 rounded-full text-sm font-medium transition-colors", item.active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground")}>
                  {item.active ? "Active" : "Set up"}
                </div>
              </button>)}
          </div>
        </motion.div>

        {/* Encouragement */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.4
      }} className="mt-6">
          <div className="scripture-card">
            <p className="font-serif text-lg text-primary-foreground/90 leading-relaxed mb-2">
              "Be very careful, then, how you live—not as unwise but as wise, making the most of every opportunity."
            </p>
            <p className="text-sm text-primary-foreground/60">Ephesians 5:15-16</p>
          </div>
        </motion.div>
      </div>
    </AppLayout>;
};
export default RhythmsPage;