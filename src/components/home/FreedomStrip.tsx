import { useState } from "react";
import { motion } from "framer-motion";
import { useRelapseEventLogger } from "@/hooks/useTriggerPatterns";
import { Shield, ChevronRight, Heart, RotateCcw, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isAfter, isSameDay } from "date-fns";
import { useFreedomStreak } from "@/hooks/useDailyProgress";
import { cn } from "@/lib/utils";

interface FreedomStripProps {
  onOpenGraceProtocol?: () => void;
}

const FreedomStrip = ({ onOpenGraceProtocol }: FreedomStripProps) => {
  const [expanded, setExpanded] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const { startDate, daysFree, resetStreak } = useFreedomStreak();
  const { logRelapseEvent } = useRelapseEventLogger();

  const today = new Date();

  const getCovenantMessage = () => {
    if (daysFree === 0) return "You are loved today. Not because of your streak, but because of the cross.";
    if (daysFree < 7) return `You are loved. ${daysFree} ${daysFree === 1 ? "day" : "days"} of walking in freedom.`;
    if (daysFree < 30) return `His grace is holding you. ${daysFree} days of faithfulness.`;
    return `The Spirit is at work in you. ${daysFree} days of transformation.`;
  };

  const isFreeDay = (date: Date): boolean => {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const resetOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return dateOnly >= resetOnly && dateOnly <= todayOnly;
  };

  const handleReset = async () => {
    await logRelapseEvent.mutateAsync();
    await resetStreak.mutateAsync();
    setResetDialogOpen(false);
    if (onOpenGraceProtocol) onOpenGraceProtocol();
  };

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
  const canGoForward = !isAfter(addWeeks(currentWeekStart, 1), today);
  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="bg-[#111111] rounded-2xl border-l-4 border-primary p-5">
      {/* Card heading */}
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-5 w-5 text-primary flex-shrink-0" />
        <h3 className="font-serif text-lg font-bold text-white">Freedom Journey</h3>
      </div>

      {/* Grace message */}
      <p className="text-sm text-white leading-relaxed mb-4">{getCovenantMessage()}</p>

      {/* Expandable calendar toggle */}
      <motion.button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 text-sm text-primary"
        whileTap={{ scale: 0.99 }}
      >
        <span>{expanded ? "Hide calendar" : "View calendar"}</span>
        <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight className="h-4 w-4" />
        </motion.div>
      </motion.button>

      {/* Expanded Calendar Detail */}
      <motion.div
        initial={false}
        animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="pt-4">
          {/* Week navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentWeekStart(subWeeks(currentWeekStart, 1)); }}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5 text-white" />
            </button>
            <span className="text-xs text-white">
              {format(currentWeekStart, "MMM d")} – {format(weekEnd, "MMM d")}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentWeekStart(addWeeks(currentWeekStart, 1)); }}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              disabled={!canGoForward}
            >
              <ChevronRight className={cn("h-3.5 w-3.5", !canGoForward ? "text-white/10" : "text-white")} />
            </button>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1.5 mb-3">
            {weekDays.map((day, i) => {
              const isFree = isFreeDay(day);
              const isToday = isSameDay(day, today);
              const isFuture = isAfter(day, today);
              return (
                <div key={day.toISOString()} className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] text-white">{dayLabels[i]}</span>
                  <div className={cn(
                    "w-7 h-7 flex items-center justify-center text-[11px] rounded-full",
                    isFree && !isToday && "bg-primary/20 text-primary",
                    isToday && isFree && "bg-primary text-[#0A0A0A] font-bold",
                    isToday && !isFree && "bg-white/15 text-white font-bold",
                    isFuture && "text-white/15",
                    !isFree && !isToday && !isFuture && "text-white/25"
                  )}>
                    {format(day, "d")}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reset link */}
          <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
            <DialogTrigger asChild>
              <button className="text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1.5">
                <RotateCcw className="h-3 w-3" />
                I need to reset my journey
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-success" />
                  Grace Meets You Here
                </DialogTitle>
                <DialogDescription className="text-left space-y-3 pt-2">
                  <p>Brother, there is no condemnation for those in Christ Jesus. Your identity is not defined by this moment.</p>
                  <p className="font-medium text-foreground">The goal is not a streak. It is returning quickly to the Father who has already received you.</p>
                  <p className="text-sm">Resetting your counter is an act of honesty and courage. We will walk you through the Grace Protocol to help you reconnect and move forward.</p>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                <DialogClose asChild>
                  <Button variant="outline" className="w-full sm:w-auto">Not right now</Button>
                </DialogClose>
                <Button variant="grace" className="w-full sm:w-auto" onClick={handleReset} disabled={resetStreak.isPending}>
                  Reset and Begin Grace Protocol
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>
    </div>
  );
};

export default FreedomStrip;
