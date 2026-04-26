import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check } from "lucide-react";
import { differenceInCalendarDays } from "date-fns";
import DailyCheckIn from "./DailyCheckIn";
import { useDailyCheckIn } from "@/hooks/useDailyProgress";
import { useAuth } from "@/hooks/useAuth";
import {
  usePublishedWeeks,
  useAllPublishedCurriculumLessons,
  useCurriculumLessonProgress,
  useUserEnrollment,
  useCurriculumSettings,
} from "@/hooks/useCurriculum";

const sansFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

interface YourPathTodayProps {
  onCheckInComplete: () => void;
  onSpiritPromptWritten?: () => void;
  onNeedSupport: () => void;
}

const fadeTransition = { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const };

const YourPathToday = ({ onCheckInComplete, onSpiritPromptWritten, onNeedSupport }: YourPathTodayProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isCheckedIn, isLoading: checkInLoading } = useDailyCheckIn();

  // Curriculum data — reuse all existing queries, do not modify
  const { data: settings } = useCurriculumSettings();
  const { data: weeks } = usePublishedWeeks();
  const { data: allLessons, isLoading: lessonsLoading } = useAllPublishedCurriculumLessons();
  const { data: progressMap } = useCurriculumLessonProgress();
  const { data: enrollment } = useUserEnrollment();

  const firstName = useMemo(() => {
    return (
      user?.user_metadata?.name?.split(" ")[0] ||
      user?.user_metadata?.first_name ||
      "King"
    );
  }, [user]);

  const { currentLesson, lessonNumber } = useMemo(() => {
    if (!weeks || !allLessons) return { currentLesson: null, lessonNumber: null };

    const dripMode = settings?.drip_mode || "weekly";
    const daysSinceEnrollment = enrollment
      ? differenceInCalendarDays(new Date(), new Date(enrollment.enrolled_at))
      : -1;

    const isWeekUnlocked = (week: any, index: number) => {
      if (index === 0) return true;
      if (!enrollment) return false;
      if (dripMode === "immediate") return true;
      return daysSinceEnrollment >= week.unlock_day_offset;
    };

    // Order lessons by week order_index then lesson order_index
    const orderedWeeks = [...weeks].sort((a: any, b: any) => a.order_index - b.order_index);
    let runningIndex = 0;
    for (let i = 0; i < orderedWeeks.length; i++) {
      const week = orderedWeeks[i];
      const weekLessons = allLessons
        .filter((l: any) => l.week_id === week.id)
        .sort((a: any, b: any) => a.order_index - b.order_index);
      if (!isWeekUnlocked(week, i)) {
        runningIndex += weekLessons.length;
        continue;
      }
      for (const lesson of weekLessons) {
        runningIndex += 1;
        const status = progressMap?.get(lesson.id)?.status;
        if (status !== "completed") {
          return { currentLesson: lesson, lessonNumber: runningIndex };
        }
      }
    }
    return { currentLesson: null, lessonNumber: null };
  }, [weeks, allLessons, progressMap, enrollment, settings]);

  const lessonDoneToday = !currentLesson;

  const isLoading = checkInLoading || lessonsLoading;

  // ============ STATE 1: NOT CHECKED IN ============
  // Wraps the existing DailyCheckIn component as-is — no logic changes
  if (!isCheckedIn && !isLoading) {
    return (
      <motion.div
        key="checkin-state"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={fadeTransition}
      >
        <DailyCheckIn
          onComplete={onCheckInComplete}
          onSpiritPromptWritten={onSpiritPromptWritten}
          onNeedSupport={onNeedSupport}
        />
      </motion.div>
    );
  }

  // ============ STATE 3: ALL DONE — ENCOURAGEMENT ============
  if (isCheckedIn && lessonDoneToday) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="rest-state"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fadeTransition}
        >
          <div
            className="dark-card-gradient rounded-[16px] text-white"
            style={{ fontFamily: sansFont, padding: "28px 22px" }}
          >
            <div
              className="flex items-center justify-center mx-auto mb-5 rounded-full"
              style={{
                width: 44,
                height: 44,
                background: "rgba(184, 150, 63, 0.12)",
              }}
            >
              <Check size={20} strokeWidth={2.25} color="#B8963F" />
            </div>
            <h2
              className="text-center mb-3"
              style={{
                fontSize: "20px",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "#F5F3EE",
                lineHeight: 1.35,
              }}
            >
              You&rsquo;ve walked the path today, {firstName}.
            </h2>
            <p className="mt-1 text-primary font-bold text-base text-center">
              Rest in who you are.
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ============ STATE 2: CHECKED IN, LESSON PENDING ============
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="lesson-state"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={fadeTransition}
      >
        <div
          className="dark-card-gradient rounded-[16px] text-white"
          style={{ fontFamily: sansFont, padding: "36px 22px 36px" }}
        >
          <p
            className="uppercase mb-4 text-center"
            style={{
              fontSize: "18px",
              fontWeight: 500,
              letterSpacing: "0.18em",
              color: "#B8963F",
            }}
          >
            Continue Your Journey
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-2" style={{ color: "rgba(245,243,238,0.5)" }}>
              <Loader2 size={16} className="animate-spin" />
              <span style={{ fontSize: 14 }}>Loading your next step…</span>
            </div>
          ) : currentLesson ? (
            <>
              <h2
                className="text-center"
                style={{
                  fontSize: "26px",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  color: "#F5F3EE",
                  lineHeight: 1.35,
                  marginBottom: 26,
                }}
              >
                {lessonNumber ? `Lesson ${lessonNumber}: ` : ""}
                {currentLesson.title}
              </h2>

              <button
                onClick={() => navigate(`/library/lesson/${currentLesson.id}`)}
                className="tap-press w-full rounded-[10px] flex items-center justify-center select-none transition-transform duration-150 active:scale-[0.97]"
                style={{
                  padding: "13px 0",
                  background: "#B8963F",
                  color: "#1A1A1A",
                  fontSize: "14px",
                  fontWeight: 600,
                  fontFamily: sansFont,
                  border: 0,
                  cursor: "pointer",
                }}
              >
                Continue Lesson
              </button>
            </>
          ) : (
            <p className="text-center" style={{ fontSize: 14, color: "rgba(245,243,238,0.6)" }}>
              Your next lesson will be available soon.
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default YourPathToday;