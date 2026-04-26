import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, Check } from "lucide-react";
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

interface YourPathTodayProps {
  onCheckInComplete: () => void;
  onSpiritPromptWritten?: () => void;
  onNeedSupport: () => void;
}

const fadeTransition = { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const };
const sansFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

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

  const { currentLesson, currentWeek, lessonInWeek, lessonsInWeekTotal } = useMemo(() => {
    if (!weeks || !allLessons) {
      return { currentLesson: null, currentWeek: null, lessonInWeek: null, lessonsInWeekTotal: null };
    }

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

    const orderedWeeks = [...weeks].sort((a: any, b: any) => a.order_index - b.order_index);
    for (let i = 0; i < orderedWeeks.length; i++) {
      const week = orderedWeeks[i];
      const weekLessons = allLessons
        .filter((l: any) => l.week_id === week.id)
        .sort((a: any, b: any) => a.order_index - b.order_index);
      if (!isWeekUnlocked(week, i)) continue;
      for (let j = 0; j < weekLessons.length; j++) {
        const lesson = weekLessons[j];
        const status = progressMap?.get(lesson.id)?.status;
        if (status !== "completed") {
          return {
            currentLesson: lesson,
            currentWeek: week,
            lessonInWeek: j + 1,
            lessonsInWeekTotal: weekLessons.length,
          };
        }
      }
    }
    return { currentLesson: null, currentWeek: null, lessonInWeek: null, lessonsInWeekTotal: null };
  }, [weeks, allLessons, progressMap, enrollment, settings]);

  const lessonDoneToday = !currentLesson;

  const isLoading = checkInLoading || lessonsLoading;

  // ============ STATE 1: NOT CHECKED IN ============
  // Wraps the existing DailyCheckIn component as-is — no logic changes
  if (!isCheckedIn && !isLoading) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="checkin-state"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fadeTransition}
        >
          <p className="type-eyebrow mb-3" style={{ color: "rgba(26, 26, 26, 0.5)" }}>
            Your Path Today
          </p>
          <DailyCheckIn
            onComplete={onCheckInComplete}
            onSpiritPromptWritten={onSpiritPromptWritten}
            onNeedSupport={onNeedSupport}
          />
        </motion.div>
      </AnimatePresence>
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
          <p className="type-eyebrow mb-3" style={{ color: "rgba(26, 26, 26, 0.5)" }}>
            Your Path Today
          </p>
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
            <h2 className="type-title text-center mb-3" style={{ color: "#F5F3EE", fontSize: 20 }}>
              You&rsquo;ve walked the path today, {firstName}.
            </h2>
            <p className="type-body text-center" style={{ color: "rgba(245, 243, 238, 0.65)" }}>
              Rest in who you are.
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ============ STATE 2: CHECKED IN, LESSON PENDING ============
  // Per #6: drop the surrounding dark card. Let it sit as flat content
  // on the page background, anchored only by the gold eyebrow.
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="lesson-state"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={fadeTransition}
        style={{ fontFamily: sansFont }}
      >
        <p className="type-eyebrow mb-4" style={{ color: "#B8963F" }}>
            Continue Your Journey
          </p>

          {isLoading ? (
          <div className="flex items-center gap-2 py-2" style={{ color: "rgba(26,26,26,0.5)" }}>
              <Loader2 size={16} className="animate-spin" />
            <span className="type-body">Loading your next step…</span>
            </div>
          ) : currentLesson ? (
            <>
              {currentWeek && (
              <p className="type-eyebrow mb-2" style={{ color: "rgba(26, 26, 26, 0.45)" }}>
                  Week {currentWeek.week_number}
                  {lessonInWeek && lessonsInWeekTotal
                    ? ` · Lesson ${lessonInWeek} of ${lessonsInWeekTotal}`
                    : ""}
                </p>
              )}
            <h2 className="type-title" style={{ color: "#1A1A1A", marginBottom: 6 }}>
                {currentLesson.title}
              </h2>
              {currentLesson.summary && (
              <p className="type-body" style={{ color: "rgba(26, 26, 26, 0.6)", marginBottom: 18 }}>
                  {currentLesson.summary}
                </p>
              )}
              {!currentLesson.summary && <div style={{ height: 18 }} />}

              <button
                onClick={() => navigate(`/library/lesson/${currentLesson.id}`)}
                className="tap-press w-full rounded-[10px] flex items-center justify-center gap-2 select-none"
                style={{
                padding: "15px 0",
                  background: "#B8963F",
                color: "#0A0A0A",
                  fontSize: "14px",
                  fontWeight: 600,
                  fontFamily: sansFont,
                  border: 0,
                  cursor: "pointer",
                boxShadow: "0 1px 0 rgba(255,255,255,0.08) inset, 0 8px 24px -12px rgba(184,150,63,0.5)",
                }}
              >
                Continue Lesson
                <ArrowRight size={16} strokeWidth={2.25} />
              </button>

              <button
                onClick={() => navigate("/library")}
                className="block w-full mt-3 transition-opacity hover:opacity-80"
                style={{
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                  fontSize: "12.5px",
                  fontWeight: 500,
                color: "rgba(26, 26, 26, 0.5)",
                  letterSpacing: "0.02em",
                }}
              >
                View The Journey →
              </button>
            </>
          ) : (
          <p className="type-body" style={{ color: "rgba(26,26,26,0.6)" }}>
              Your next lesson will be available soon.
            </p>
          )}
      </motion.div>
    </AnimatePresence>
  );
};

export default YourPathToday;