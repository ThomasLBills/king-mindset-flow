import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import ToolCard from "@/components/home/ToolCard";
import PressureRisingTool from "@/components/tools/PressureRisingTool";
import TemptationTool from "@/components/tools/TemptationTool";
import AfterFallTool from "@/components/tools/AfterFallTool";
import ReachOut from "@/components/brotherhood/ReachOut";
import QuickHelpModal from "@/components/tools/QuickHelpModal";
import { Flame, Shield, Heart, Moon, Users, Zap, Sparkles } from "lucide-react";

const quickCards = [
  { 
    id: "fatigue", 
    label: "I'm tired", 
    icon: Moon, 
    color: "text-primary",
    bgColor: "bg-primary/10",
    title: "When You're Exhausted",
    scripture: "Come to me, all you who are weary and burdened, and I will give you rest.",
    reference: "Matthew 11:28",
    steps: [
      "Acknowledge the tiredness without shame",
      "Take three slow, deep breaths",
      "Consider: What does your body need right now?",
      "Remember: Fatigue makes you vulnerable—guard your inputs",
    ],
    action: "Rest is not weakness. It's wisdom."
  },
  { 
    id: "lonely", 
    label: "I'm lonely", 
    icon: Users, 
    color: "text-accent",
    bgColor: "bg-accent/10",
    title: "When Loneliness Hits",
    scripture: "The Lord is close to the brokenhearted and saves those who are crushed in spirit.",
    reference: "Psalm 34:18",
    steps: [
      "Name the loneliness—don't numb it",
      "Reach out to one person (text, call, anything)",
      "Remember: Isolation is where the enemy wins",
      "God's presence is real, even when unfelt",
    ],
    action: "You are never truly alone."
  },
  { 
    id: "stressed", 
    label: "I'm stressed", 
    icon: Zap, 
    color: "text-warning",
    bgColor: "bg-warning/10",
    title: "When Stress Is Rising",
    scripture: "Cast all your anxiety on him because he cares for you.",
    reference: "1 Peter 5:7",
    steps: [
      "Pause. Name what's causing the stress",
      "Ask: What's in my control? What's not?",
      "Release what's not yours to carry",
      "Do one small thing to move forward",
    ],
    action: "You weren't made to carry this alone."
  },
];

const ToolsPage = () => {
  const [showPressure, setShowPressure] = useState(false);
  const [showTemptation, setShowTemptation] = useState(false);
  const [showGrace, setShowGrace] = useState(false);
  const [showReachOut, setShowReachOut] = useState(false);
  const [activeQuickHelp, setActiveQuickHelp] = useState<typeof quickCards[0] | null>(null);

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
            <span className="text-sm text-muted-foreground">Here when you need them</span>
          </div>
          <h1 className="font-serif text-3xl font-bold mb-2">Your Tools</h1>
          <p className="text-muted-foreground">
            Choose the tool that matches your moment
          </p>
        </motion.div>

        {/* Main Tools */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3 mb-8"
        >
          <ToolCard
            title="Pressure Rising"
            description="Notice → Name Truth → Redirect"
            icon={Flame}
            variant="pressure"
            onClick={() => setShowPressure(true)}
          />
          <ToolCard
            title="Active Temptation"
            description="The way out when you need it now"
            icon={Shield}
            variant="temptation"
            onClick={() => setShowTemptation(true)}
          />
          <ToolCard
            title="After a Fall"
            description="Grace Protocol: Return quickly"
            icon={Heart}
            variant="grace"
            onClick={() => setShowGrace(true)}
          />
        </motion.div>

        {/* Quick Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-serif text-xl font-semibold mb-4">Quick Help</h2>
          <div className="grid grid-cols-3 gap-3">
            {quickCards.map((card, index) => (
              <motion.button
                key={card.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                onClick={() => setActiveQuickHelp(card)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border-2 border-border hover:border-primary/30 hover:shadow-md transition-all duration-200"
              >
                <div className={`p-2.5 rounded-xl ${card.bgColor}`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <span className="text-sm font-medium text-center">{card.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Emergency Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <button
            onClick={() => setShowReachOut(true)}
            className="w-full p-4 rounded-xl bg-accent/10 border-2 border-accent/20 hover:bg-accent/15 hover:border-accent/30 transition-all duration-200"
          >
            <div className="flex items-center justify-center gap-3">
              <Users className="w-5 h-5 text-accent" />
              <span className="font-semibold text-accent">Reach Out Now</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Connect with a brother immediately
            </p>
          </button>
        </motion.div>

        {/* Scripture */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <div className="scripture-card">
            <p className="font-serif text-lg text-primary-foreground/90 leading-relaxed mb-2">
              "No temptation has overtaken you except what is common to mankind. And God is faithful; he will not let you be tempted beyond what you can bear."
            </p>
            <p className="text-sm text-primary-foreground/60">1 Corinthians 10:13</p>
          </div>
        </motion.div>
      </div>

      {/* Tool Modals */}
      <AnimatePresence>
        {showPressure && (
          <PressureRisingTool
            onClose={() => setShowPressure(false)}
            onReachOut={() => {
              setShowPressure(false);
              setShowReachOut(true);
            }}
          />
        )}
        {showTemptation && (
          <TemptationTool
            onClose={() => setShowTemptation(false)}
            onReachOut={() => {
              setShowTemptation(false);
              setShowReachOut(true);
            }}
          />
        )}
        {showGrace && (
          <AfterFallTool
            onClose={() => setShowGrace(false)}
            onReachOut={() => {
              setShowGrace(false);
              setShowReachOut(true);
            }}
          />
        )}
        {showReachOut && <ReachOut onClose={() => setShowReachOut(false)} />}
        {activeQuickHelp && (
          <QuickHelpModal
            data={activeQuickHelp}
            onClose={() => setActiveQuickHelp(null)}
            onReachOut={() => {
              setActiveQuickHelp(null);
              setShowReachOut(true);
            }}
          />
        )}
      </AnimatePresence>
    </AppLayout>
  );
};

export default ToolsPage;
