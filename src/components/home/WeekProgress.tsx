import { motion } from "framer-motion";
import { BookOpen, ChevronRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useAllWeeks,
  useAllPublishedCurriculumLessons,
  useCurriculumLessonProgress,
  useUserEnrollment,
} from "@/hooks/useCurriculum";
import { differenceInDays } from "date-fns";

const WeekProgress = () => {
  const navigate = useNavigate();
  const { data: weeks, isLoading: wLoading } = useAllWeeks();
  const { data: allLessons, isLoading: lLoading } = useAllPublishedCurriculumLessons();
  const { data: progressMap } = useCurriculumLessonProgress();
  const { data: enrollment } = useUserEnrollment();

  if (wLoading || lLoading) {
    return (
      <div className="card-elevated p-5 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalLessons = allLessons?.length ?? 0;
  const completedLessons = allLessons?.filter(l => progressMap?.get(l.id)?.status === "completed").length ?? 0;
  const overallPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Find current week (first non-completed unlocked week)
  const daysSinceEnrollment = enrollment
    ? differenceInDays(new Date(), new Date(enrollment.enrolled_at))
    : -1;

  const isWeekUnlocked = (week: any) => {
    if (!enrollment) return false;
    return daysSinceEnrollment >= week.unlock_day_offset;
  };

  const getWeekLessons = (weekId: string) =>
    (allLessons ?? []).filter(l => l.week_id === weekId);

  const isWeekComplete = (weekId: string) => {
    const lessons = getWeekLessons(weekId);
    if (lessons.length === 0) return false;
    return lessons.every(l => progressMap?.get(l.id)?.status === "completed");
  };

  const currentWeek = weeks?.find(w => isWeekUnlocked(w) && !isWeekComplete(w.id));
  const currentWeekNumber = currentWeek?.week_number ?? (completedLessons === totalLessons && totalLessons > 0 ? 8 : 1);
  const weekTitle = currentWeek?.title ?? (overallPercent === 100 ? "Complete!" : "Not enrolled");
  const weekSummary = currentWeek?.summary ?? "";

  const circumference = 150.8;

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate("/library")}
      className="card-elevated p-5 w-full text-left"
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <svg className="w-14 h-14 -rotate-90">
            <circle cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
            <motion.circle
              cx="28" cy="28" r="24" fill="none"
              stroke="hsl(var(--accent))" strokeWidth="4" strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - (circumference * overallPercent) / 100 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-accent" />
          </div>
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            {completedLessons}/{totalLessons} lessons · {overallPercent}%
          </p>
          <h3 className="font-serif text-lg font-semibold">
            {currentWeek ? `Week ${currentWeekNumber}: ${weekTitle}` : weekTitle}
          </h3>
          {weekSummary && <p className="text-sm text-muted-foreground">{weekSummary}</p>}
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </div>
    </motion.button>
  );
};

export default WeekProgress;
