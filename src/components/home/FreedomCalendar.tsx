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
    if (daysFree === 0) return "You are loved today. Not because of your streak, but because of the cross. Walk in freedom.";
    if (daysFree < 7) return `You are loved. ${daysFree} ${daysFree === 1 ? "day" : "days"} of walking in freedom.`;
    if (daysFree < 30) return `His grace is holding you. ${daysFree} days of faithfulness.`;
    return `The Spirit is at work in you. ${daysFree} days of transformation.`;
  };

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const canGoForward = !isAfter(addWeeks(currentWeekStart, 1), today);

  return (
    <div className="rounded-2xl p-6 bg-[hsl(225_12%_8%)] text-white relative overflow-hidden -mx-6" style={{ borderRadius: 0, paddingLeft: "1.5rem", paddingRight: "1.5rem" }}>
      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="font-serif font-semibold text-primary">Freedom Journey</h3>
        </div>
        <Badge className="font-semibold bg-white/10 text-primary border-0">
          {daysFree} {daysFree === 1 ? "day" : "days"}
        </Badge>
      </div>

      <p className="relative text-sm text-white/70 mb-4 font-medium leading-relaxed">
        {getCovenantMessage()}
      </p>

      <div className="relative flex items-center justify-between mb-3">
        <button
          onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-white/50" />
        </button>
        <span className="text-sm font-medium text-white/60">
          {format(currentWeekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
        </span>
        <button
          onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          disabled={!canGoForward}
        >
          <ChevronRight className={cn(
            "h-4 w-4",
            !canGoForward ? "text-white/15" : "text-white/50"
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
              <span className="text-[10px] text-white/40 font-medium">
                {dayLabels[i]}
              </span>
              <motion.div
                initial={false}
                className={cn(
                  "w-8 h-8 flex items-center justify-center text-xs rounded-full transition-colors",
                  isFree && !isToday && "bg-primary/20 text-primary font-medium",
                  isToday && isFree && "bg-primary text-[#0A0A0A] font-bold ring-2 ring-primary/30",
                  isToday && !isFree && "bg-white/15 text-white font-bold ring-2 ring-white/20",
                  isFuture && "text-white/20 bg-white/5",
                  !isFree && !isToday && !isFuture && "text-white/30 bg-white/5"
                )}
              >
                {format(day, "d")}
              </motion.div>
            </div>
          );
        })}
      </div>

      <div className="relative mt-4 pt-4 border-t border-white/10">
        <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-white/30 hover:text-white/50 hover:bg-white/5"
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
