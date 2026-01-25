import { motion } from "framer-motion";
import { BookOpen, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface WeekProgressProps {
  currentWeek: number;
  weekTitle: string;
  weekTheme: string;
}

const WeekProgress = ({ currentWeek, weekTitle, weekTheme }: WeekProgressProps) => {
  const navigate = useNavigate();
  const progress = (currentWeek / 8) * 100;

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate("/library")}
      className="card-elevated p-5 w-full text-left"
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <svg className="w-14 h-14 -rotate-90">
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="4"
            />
            <motion.circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke="hsl(var(--accent))"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={150.8}
              initial={{ strokeDashoffset: 150.8 }}
              animate={{ strokeDashoffset: 150.8 - (150.8 * progress) / 100 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-accent" />
          </div>
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Week {currentWeek} of 8
          </p>
          <h3 className="font-serif text-lg font-semibold">{weekTitle}</h3>
          <p className="text-sm text-muted-foreground">{weekTheme}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </div>
    </motion.button>
  );
};

export default WeekProgress;
