import { motion } from "framer-motion";
import { Eye } from "lucide-react";

interface PatternInsightCardProps {
  title: string;
  message: string;
  scriptureRef: string;
  scriptureText: string;
  actionStep: string;
  onDismiss: () => void;
}

const PatternInsightCard = ({
  title,
  message,
  scriptureRef,
  scriptureText,
  actionStep,
  onDismiss,
}: PatternInsightCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-2xl bg-[hsl(225_12%_8%)] text-white border-l-4 border-l-primary p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Eye className="w-4 h-4 text-primary" />
        <p className="text-sm font-medium text-primary">{title}</p>
      </div>

      {/* Pattern message */}
      <p className="text-sm text-white/80 leading-relaxed mb-4">
        {message}
      </p>

      {/* Scripture */}
      <div className="bg-white/5 border border-primary/20 rounded-xl p-4 mb-4">
        <p className="text-xs text-primary/70 mb-1.5 font-medium">
          Here is what the Spirit may be saying:
        </p>
        <p className="font-serif text-sm text-white/80 italic leading-relaxed">
          "{scriptureText}"
        </p>
        <p className="text-xs text-primary mt-2 font-medium">{scriptureRef}</p>
      </div>

      {/* Action step */}
      <div className="bg-white/5 rounded-xl p-4 mb-4">
        <p className="text-xs text-white/50 mb-1 font-medium uppercase tracking-wider">Your next step</p>
        <p className="text-sm text-white/75 leading-relaxed">{actionStep}</p>
      </div>

      {/* Dismiss */}
      <button
        onClick={onDismiss}
        className="text-xs text-primary/60 hover:text-primary transition-colors"
      >
        I hear it. Close.
      </button>
    </motion.div>
  );
};

export default PatternInsightCard;
