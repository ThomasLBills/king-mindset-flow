import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ChevronRight, Lock, Check, BookOpen, Play, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  useAllWeeks,
  useAllPublishedCurriculumLessons,
  useCurriculumLessonProgress,
  useUserEnrollment,
  useEnroll,
  useCurriculumSettings,
} from "@/hooks/useCurriculum";
import { useAuth } from "@/hooks/useAuth";
import { differenceInDays } from "date-fns";

const LibraryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: settings, isLoading: settingsLoading } = useCurriculumSettings();
  const { data: weeks, isLoading: weeksLoading } = useAllWeeks();
  const { data: allLessons, isLoading: lessonsLoading } = useAllPublishedCurriculumLessons();
  const { data: progressMap } = useCurriculumLessonProgress();
  const { data: enrollment } = useUserEnrollment();
  const enroll = useEnroll();

  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  const isLoading = settingsLoading || weeksLoading || lessonsLoading;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  const daysSinceEnrollment = enrollment
    ? differenceInDays(new Date(), new Date(enrollment.enrolled_at))
    : -1;

  const dripMode = settings?.drip_mode || "weekly";

  const isWeekUnlocked = (week: any, index: number) => {
    if (!enrollment) return false;
    if (dripMode === "immediate") return true;
    // Sequential: previous week must be completed (except week 0)
    if (index > 0 && weeks) {
      const prevWeek = weeks[index - 1];
      if (prevWeek && !isWeekCompleted(prevWeek.id)) {
        // Still respect day offset even if prev is complete
        if (daysSinceEnrollment < week.unlock_day_offset) return false;
        // If day offset passed but prev not done, still locked (sequential)
        return false;
      }
    }
    return daysSinceEnrollment >= week.unlock_day_offset;
  };

  const getLessonsForWeek = (weekId: string) =>
    (allLessons ?? []).filter(l => l.week_id === weekId);

  const getWeekProgress = (weekId: string) => {
    const lessons = getLessonsForWeek(weekId);
    if (lessons.length === 0) return 0;
    const completed = lessons.filter(l => progressMap?.get(l.id)?.status === "completed").length;
    return Math.round((completed / lessons.length) * 100);
  };

  const isWeekCompleted = (weekId: string) => getWeekProgress(weekId) === 100;

  const totalLessons = allLessons?.length ?? 0;
  const completedLessons = allLessons?.filter(l => progressMap?.get(l.id)?.status === "completed").length ?? 0;
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Find current week (first non-completed unlocked week)
  const currentWeekId = weeks?.find((w, i) => isWeekUnlocked(w, i) && !isWeekCompleted(w.id))?.id;

  // Auto-expand current week
  if (currentWeekId && expandedWeek === null) {
    // use a timeout-free approach
  }

  const handleEnroll = async () => {
    await enroll.mutateAsync();
  };

  return (
    <AppLayout>
      <div className="px-5 py-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <p className="text-sm text-muted-foreground mb-1">
            Your Liberation Curriculum
          </p>
          <h1 className="font-serif text-3xl font-bold mb-2">
            The Liberated Path
          </h1>
          <p className="text-muted-foreground">
            Eight weeks. One transformation.
          </p>
        </motion.div>

        {/* Enrollment CTA */}
        {!enrollment && user && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="p-5 rounded-2xl bg-primary/5 border-2 border-primary/20 text-center">
              <h2 className="font-serif text-lg font-semibold mb-2">Start Your Journey</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Enroll to unlock the curriculum and track your progress.
              </p>
              <Button onClick={handleEnroll} disabled={enroll.isPending}>
                {enroll.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Enroll Now
              </Button>
            </div>
          </motion.div>
        )}

        {/* Overall Progress */}
        {enrollment && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Journey Progress</span>
              <span className="text-sm text-muted-foreground">{completedLessons}/{totalLessons} lessons</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </motion.div>
        )}

        {/* Weeks */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-3">
          {(weeks ?? []).map((week, index) => {
            const unlocked = enrollment ? isWeekUnlocked(week, index) : false;
            const completed = isWeekCompleted(week.id);
            const isCurrent = week.id === currentWeekId;
            const weekProgress = getWeekProgress(week.id);
            const lessons = getLessonsForWeek(week.id);

            return (
              <motion.div
                key={week.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
              <button
                  onClick={() => unlocked && setExpandedWeek(expandedWeek === week.id ? null : week.id)}
                  disabled={!unlocked}
                  className="w-full text-left p-4 rounded-2xl bg-[#111111] border-l-4 border-primary transition-all hover:border-primary/80"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "w-11 h-11 rounded-full flex items-center justify-center font-semibold text-sm transition-all",
                        completed
                          ? "bg-primary/15"
                          : unlocked
                          ? "bg-primary/15"
                          : "bg-white/10"
                      )}
                    >
                      {completed ? (
                        <Check className="w-5 h-5 text-primary" />
                      ) : unlocked ? (
                        <BookOpen className="w-5 h-5 text-primary" />
                      ) : (
                        <Lock className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="text-xs text-white/50 block mb-0.5">Week {week.week_number}</span>
                      <h3 className="font-serif font-bold text-lg text-white">{week.title}</h3>
                      <p className="text-sm text-white/50">{week.summary || ""}</p>
                      {unlocked && weekProgress > 0 && weekProgress < 100 && (
                        <div className="mt-2">
                          <Progress value={weekProgress} className="h-1" />
                        </div>
                      )}
                    </div>
                    {unlocked && (
                      <ChevronRight
                        className={cn(
                          "w-5 h-5 text-white/30 transition-transform duration-200",
                          expandedWeek === week.id && "rotate-90"
                        )}
                      />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {expandedWeek === week.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 pl-[60px] space-y-2">
                        {lessons.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">No lessons published yet.</p>
                        ) : (
                          lessons.map((lesson) => {
                            const lp = progressMap?.get(lesson.id);
                            const isComplete = lp?.status === "completed";
                            return (
                              <button
                                key={lesson.id}
                                onClick={() => navigate(`/library/lesson/${lesson.id}`)}
                                className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all group"
                              >
                                <div className={cn(
                                  "p-2 rounded-lg transition-colors",
                                  isComplete ? "bg-primary/15" : "bg-primary/10 group-hover:bg-primary/20"
                                )}>
                                  {isComplete ? (
                                    <Check className="w-4 h-4 text-primary" />
                                  ) : lesson.video_url ? (
                                    <Play className="w-4 h-4 text-primary" />
                                  ) : (
                                    <BookOpen className="w-4 h-4 text-primary" />
                                  )}
                                </div>
                                <div className="flex-1 text-left">
                                  <span className="text-sm font-medium block text-white">{lesson.title}</span>
                                  <span className="text-xs text-white/50">
                                    {lesson.duration_minutes ? `${lesson.duration_minutes} min` : "Lesson"}
                                    {isComplete && " · Completed"}
                                  </span>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default LibraryPage;
