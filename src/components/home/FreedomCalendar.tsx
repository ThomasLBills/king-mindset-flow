import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Heart, Sparkles, RotateCcw } from "lucide-react";
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

interface FreedomCalendarProps {
  onOpenGraceProtocol?: () => void;
}

const FreedomCalendar = ({ onOpenGraceProtocol }: FreedomCalendarProps) => {
  // In production, this would come from a database
  const [startDate] = useState<Date>(() => {
    const saved = localStorage.getItem("freedom-start-date");
    return saved ? new Date(saved) : new Date();
  });
  
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [lastResetDate, setLastResetDate] = useState<Date>(() => {
    const saved = localStorage.getItem("freedom-start-date");
    return saved ? new Date(saved) : new Date();
  });

  // Calculate days free
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - lastResetDate.getTime());
  const daysFree = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Generate marked dates (days of freedom)
  const getFreeDates = (): Date[] => {
    const dates: Date[] = [];
    const current = new Date(lastResetDate);
    while (current <= today) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const freeDates = getFreeDates();

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
    if (daysFree === 0) {
      return "Today is a new beginning. Grace meets you here.";
    } else if (daysFree === 1) {
      return "One day at a time. You're walking in freedom.";
    } else if (daysFree < 7) {
      return "Every day matters. Keep walking, king.";
    } else if (daysFree < 30) {
      return "Building new patterns. The Spirit is at work.";
    } else if (daysFree < 90) {
      return "Transformation is happening. Stay connected.";
    } else {
      return "Deep roots of freedom. You're becoming who you already are.";
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5 text-primary" />
            Freedom Journey
          </CardTitle>
          <Badge variant="secondary" className="font-semibold">
            <Sparkles className="h-3 w-3 mr-1" />
            {daysFree} {daysFree === 1 ? "day" : "days"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Encouragement Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 p-3 bg-secondary/50 rounded-lg"
        >
          <p className="text-sm text-muted-foreground italic font-serif">
            "{getMessage()}"
          </p>
        </motion.div>

        {/* Calendar */}
        <div className="flex justify-center">
          <Calendar
            mode="multiple"
            selected={freeDates}
            className={cn("p-0 pointer-events-auto")}
            classNames={{
              months: "flex flex-col",
              month: "space-y-2",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: cn(
                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-input"
              ),
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse",
              head_row: "flex justify-between",
              head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] text-center",
              row: "flex w-full mt-1 justify-between",
              cell: cn(
                "h-8 w-8 text-center text-sm p-0 relative",
                "[&:has([aria-selected])]:bg-success/20 [&:has([aria-selected])]:rounded-md"
              ),
              day: cn(
                "h-8 w-8 p-0 font-normal rounded-md hover:bg-accent/50 transition-colors",
                "aria-selected:bg-success aria-selected:text-success-foreground aria-selected:font-medium"
              ),
              day_selected: "bg-success text-success-foreground hover:bg-success hover:text-success-foreground",
              day_today: "bg-accent text-accent-foreground font-bold",
              day_outside: "text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-50",
              day_hidden: "invisible",
            }}
            disabled={(date) => date > today}
          />
        </div>

        {/* Grace-first Reset Option */}
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
      </CardContent>
    </Card>
  );
};

export default FreedomCalendar;
