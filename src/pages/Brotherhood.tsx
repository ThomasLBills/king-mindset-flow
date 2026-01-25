import { useState } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import ReachOut from "@/components/brotherhood/ReachOut";
import { Button } from "@/components/ui/button";
import { Users, MessageCircle, Heart, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";

const brothers = [
  {
    id: "1",
    name: "Marcus Johnson",
    initials: "MJ",
    lastActive: "2 hours ago",
    status: "online",
  },
  {
    id: "2",
    name: "David Williams",
    initials: "DW",
    lastActive: "Yesterday",
    status: "offline",
  },
  {
    id: "3",
    name: "James Thompson",
    initials: "JT",
    lastActive: "3 days ago",
    status: "offline",
  },
];

const recentMessages = [
  {
    id: "1",
    from: "Marcus",
    message: "Praying for you, brother. You've got this.",
    time: "2h ago",
    type: "encouragement",
  },
  {
    id: "2",
    from: "You",
    message: "Had a tough moment but made it through.",
    time: "Yesterday",
    type: "checkin",
  },
];

const BrotherhoodPage = () => {
  const [showReachOut, setShowReachOut] = useState(false);

  return (
    <AppLayout>
      <div className="px-5 py-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="font-serif text-3xl font-bold mb-2">Brotherhood</h1>
          <p className="text-muted-foreground">
            Freedom is sustained together
          </p>
        </motion.div>

        {/* Quick Reach Out */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Button
            variant="brotherhood"
            size="lg"
            onClick={() => setShowReachOut(true)}
            className="w-full"
          >
            <MessageCircle className="w-5 h-5" />
            Reach Out Now
          </Button>
        </motion.div>

        {/* My Brothers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-semibold">My Brothers</h2>
            <button className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {brothers.map((brother) => (
              <div
                key={brother.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center font-semibold">
                    {brother.initials}
                  </div>
                  {brother.status === "online" && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-card" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{brother.name}</p>
                  <p className="text-sm text-muted-foreground">{brother.lastActive}</p>
                </div>
                <button className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-serif text-xl font-semibold mb-4">Recent</h2>
          <div className="space-y-3">
            {recentMessages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "p-4 rounded-xl",
                  msg.from === "You" ? "bg-primary/5 border border-primary/20" : "bg-secondary"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{msg.from}</span>
                  <span className="text-xs text-muted-foreground">{msg.time}</span>
                </div>
                <p className="text-sm text-muted-foreground">{msg.message}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Community Guidelines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <div className="safe-zone">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-success" />
              <span className="font-medium">Safe Space Guidelines</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• No explicit details needed—connection is what matters</li>
              <li>• Restore with gentleness, not judgment</li>
              <li>• What's shared here stays here</li>
            </ul>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showReachOut && <ReachOut onClose={() => setShowReachOut(false)} />}
      </AnimatePresence>
    </AppLayout>
  );
};

export default BrotherhoodPage;
