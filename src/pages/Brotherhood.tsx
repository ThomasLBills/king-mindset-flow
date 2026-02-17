import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { Users } from "lucide-react";
import MyBrothersTab from "@/components/brotherhood/MyBrothersTab";
import ReachOut from "@/components/brotherhood/ReachOut";
import { useAuth } from "@/hooks/useAuth";

const BrotherhoodPage = () => {
  const { user } = useAuth();
  const [showReachOut, setShowReachOut] = useState(false);

  return (
    <AppLayout>
      <div className="px-5 py-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <h1 className="font-serif text-3xl font-bold mb-1">Brotherhood</h1>
          <p className="text-muted-foreground text-sm">Freedom is sustained together</p>
        </motion.div>

        {/* Safe Space Guidelines */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-5">
          <div className="rounded-xl bg-card border border-border p-4">
            <div className="mb-2">
              <span className="font-medium">EXPECTATIONS:</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Connection matters more than details</li>
              <li>• Restore with grace, not condemnation</li>
              <li>• What's spoken here stays here</li>
            </ul>
          </div>
        </motion.div>

        {/* Reach Out Now */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-5"
        >
          <button
            onClick={() => setShowReachOut(true)}
            className="w-full text-left p-4 rounded-2xl bg-[#111111] border-l-4 border-primary transition-all hover:border-primary/80"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-white">Reach Out Now</h3>
                <p className="text-sm text-white">Connect with a brother immediately</p>
              </div>
            </div>
          </button>
        </motion.div>

        {/* My Brothers list */}
        <MyBrothersTab onStartDM={() => {}} />
      </div>

      {showReachOut && <ReachOut onClose={() => setShowReachOut(false)} />}
    </AppLayout>
  );
};

export default BrotherhoodPage;
