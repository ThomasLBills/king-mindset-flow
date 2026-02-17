import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Heart, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
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

interface FreedomCalendarProps {
  onOpenGraceProtocol?: () => void;
}

const FreedomCalendar = ({ onOpenGraceProtocol }: FreedomCalendarProps) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const { startDate, daysFree, resetStreak, isLoading } = useFreedomStreak();

  const today = new Date();

  const isFreeDay = (date: Date): boolean => {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const resetOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return dateOnly >= resetOnly && dateOnly <= todayOnly;
  };

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });

  const handleReset = async () => {
    await resetStreak.mutateAsync();
    setResetDialogOpen(false);
    if (onOpenGraceProtocol) {
      onOpenGraceProtocol();
    }
  };

  const getCovenantMessage = () => {
    if (daysFree === 0) return "Your King is pleased with your pursuit. Today is Day 1.";
    if (daysFree < 7) return `${daysFree} ${daysFree === 1 ? "day" : "days"} walking in freedom. Stay rooted.`;
    return `${daysFree} days of faithfulness. Your identity is holding.`;
  };

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const canGoForward = !isAfter(addWeeks(currentWeekStart, 1), today);
  const hasActiveStreak = daysFree > 0;

  return (
    <div className={cn(
      "card-elevated p-6 relative overflow-hidden",
      hasActiveStreak && "ring-1 ring-primary/20"
    )}>
      {/* Subtle glow when streak is active */}
      {hasActiveStreak && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse at top right, hsl(40 44% 57% / 0.06) 0%, transparent 60%)"
        }} />
      )}

      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="font-serif font-semibold">Freedom Journey</h3>
        </div>
        <Badge variant="secondary" className="font-semibold bg-primary/15 text-primary border-0">
          {daysFree} {daysFree === 1 ? "day" : "days"}
        </Badge>
      </div>

      <p className="relative text-sm text-muted-foreground mb-4 font-medium">
        {getCovenantMessage()}
      </p>

      <div className="relative flex items-center justify-between mb-3">
        <button
          onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
          className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <span className="text-sm font-medium">
          {format(currentWeekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
        </span>
        <button
          onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
          className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
          disabled={!canGoForward}
        >
          <ChevronRight className={cn(
            "h-4 w-4",
            !canGoForward ? "text-muted-foreground/30" : "text-muted-foreground"
          )} />
        </button>
      </div>

      <div className="relative grid grid-cols-7 gap-2">
        {weekDays.map((day, i) => {
          const isFree = isFreeDay(day);
          const isToday = isSameDay(day, today);
          const isFuture = isAfter(day, today);

          return (
            <div key={day.toISOString()} className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground font-medium">
                {dayLabels[i]}
              </span>
              <motion.div
                initial={false}
                className={cn(
                  "w-8 h-8 flex items-center justify-center text-xs rounded-full transition-colors",
                  isFree && !isToday && "bg-primary/15 text-primary font-medium",
                  isToday && isFree && "bg-primary text-primary-foreground font-bold ring-2 ring-primary/30",
                  isToday && !isFree && "bg-accent text-accent-foreground font-bold ring-2 ring-accent/30",
                  isFuture && "text-muted-foreground/30 bg-muted/30",
                  !isFree && !isToday && !isFuture && "text-muted-foreground bg-muted/50"
                )}
              >
                {format(day, "d")}
              </motion.div>
            </div>
          );
        })}
      </div>

      <div className="relative mt-4 pt-4 border-t border-border">
        <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              I need to reset my journey
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-success" />
                Grace Meets You Here
              </DialogTitle>
              <DialogDescription className="text-left space-y-3 pt-2">
                <p>
                  Brother, there is no condemnation for those in Christ Jesus. 
                  Your identity is not defined by this moment.
                </p>
                <p className="font-medium text-foreground">
                  The goal is not a streak. It is returning quickly to the Father who 
                  has already received you.
                </p>
                <p className="text-sm">
                  Resetting your counter is an act of honesty and courage. 
                  We will walk you through the Grace Protocol to help you 
                  reconnect and move forward.
                </p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
              <DialogClose asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  Not right now
                </Button>
              </DialogClose>
              <Button
                variant="grace"
                className="w-full sm:w-auto"
                onClick={handleReset}
                disabled={resetStreak.isPending}
              >
                Reset and Begin Grace Protocol
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default FreedomCalendar;
