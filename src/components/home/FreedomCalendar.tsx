import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Heart, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
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
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isAfter } from "date-fns";

interface FreedomCalendarProps {
  onOpenGraceProtocol?: () => void;
}

const FreedomCalendar = ({ onOpenGraceProtocol }: FreedomCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [lastResetDate, setLastResetDate] = useState<Date>(() => {
    const saved = localStorage.getItem("freedom-start-date");
    return saved ? new Date(saved) : new Date();
  });

  const today = new Date();
  const diffTime = Math.abs(today.getTime() - lastResetDate.getTime());
  const daysFree = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Check if a date is a "free" day
  const isFreeDday = (date: Date): boolean => {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const resetOnly = new Date(lastResetDate.getFullYear(), lastResetDate.getMonth(), lastResetDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return dateOnly >= resetOnly && dateOnly <= todayOnly;
  };

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get day of week for first day (0 = Sunday)
  const startDayOfWeek = monthStart.getDay();

  const handleReset = () => {
    const now = new Date();
    localStorage.setItem("freedom-start-date", now.toISOString());
    setLastResetDate(now);
    setResetDialogOpen(false);
    if (onOpenGraceProtocol) {
      onOpenGraceProtocol();
    }
  };

  const getMessage = () => {
    if (daysFree === 0) return "Today is a new beginning.";
    if (daysFree === 1) return "One day at a time.";
    if (daysFree < 7) return "Every day matters.";
    if (daysFree < 30) return "Building new patterns.";
    if (daysFree < 90) return "Transformation is happening.";
    return "Deep roots of freedom.";
  };

  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="card-elevated p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h3 className="font-serif font-semibold">Freedom Journey</h3>
        </div>
        <Badge variant="secondary" className="font-semibold bg-success/15 text-success border-0">
          {daysFree} {daysFree === 1 ? "day" : "days"}
        </Badge>
      </div>

      {/* Message */}
      <p className="text-sm text-muted-foreground mb-4 italic">
        "{getMessage()}"
      </p>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <span className="text-sm font-medium">
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
          disabled={isAfter(addMonths(currentMonth, 1), today)}
        >
          <ChevronRight className={cn(
            "h-4 w-4",
            isAfter(addMonths(currentMonth, 1), today) 
              ? "text-muted-foreground/30" 
              : "text-muted-foreground"
          )} />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((day, i) => (
          <div key={i} className="text-center text-xs text-muted-foreground font-medium py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((day) => {
          const isFree = isFreeDday(day);
          const isToday = isSameDay(day, today);
          const isFuture = isAfter(day, today);

          return (
            <motion.div
              key={day.toISOString()}
              initial={false}
              className={cn(
                "aspect-square flex items-center justify-center text-sm rounded-lg transition-colors",
                isFree && !isToday && "bg-success/20 text-success font-medium",
                isToday && isFree && "bg-success text-success-foreground font-bold",
                isToday && !isFree && "bg-accent text-accent-foreground font-bold",
                isFuture && "text-muted-foreground/30",
                !isFree && !isToday && !isFuture && "text-muted-foreground"
              )}
            >
              {format(day, "d")}
            </motion.div>
          );
        })}
      </div>

      {/* Reset Button */}
      <div className="mt-4 pt-4 border-t border-border">
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
                  The goal isn't a streak—it's returning quickly to the Father who 
                  has already received you.
                </p>
                <p className="text-sm">
                  Resetting your counter is an act of honesty and courage. 
                  We'll walk you through the Grace Protocol to help you 
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
              >
                Reset & Begin Grace Protocol
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default FreedomCalendar;
