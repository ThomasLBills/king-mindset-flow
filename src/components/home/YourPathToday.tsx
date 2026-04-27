import { useEffect, useMemo, useRef, useState } from "react";
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

  // After a check-in is completed, show a minimal "Completed" confirmation
  // card for 2 seconds before transitioning to "Continue Your Journey."
  // The confirmation should only display ONCE — the moment the user actually
  // completes the check-in. On subsequent visits to Home today, skip it.
  // We persist a "seen" flag in localStorage keyed by today's LOCAL date so
  // it survives remounts and auto-resets at local midnight (next day = new key).
  const buildTodayKey = () => {
    const d = new Date();
    return `lk:checkin-confirmed:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const [todayKey, setTodayKey] = useState<string>(() => buildTodayKey());

  // Recompute the date key exactly at local midnight so a long-lived session
  // picks up the new day without requiring a remount.
  useEffect(() => {
    const scheduleMidnight = () => {
      const now = new Date();
      const next = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        1, // 1s past midnight to avoid edge timing
        0
      );
      const ms = Math.max(1000, next.getTime() - now.getTime());
      return setTimeout(() => {
        setTodayKey(buildTodayKey());
        // Reset prev ref so a fresh local "transition" can fire tomorrow
        // if the component is still mounted across midnight.
        prevCheckedInRef.current = null;
        timer = scheduleMidnight();
      }, ms);
    };
    let timer = scheduleMidnight();
    return () => clearTimeout(timer);
  }, []);

  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const prevCheckedInRef = useRef<boolean | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Only fire when we observe a transition from "not checked in" → "checked in"
    // during this component's lifetime (i.e. the user just completed the action).
    const prev = prevCheckedInRef.current;
    prevCheckedInRef.current = isCheckedIn;

    if (prev === false && isCheckedIn) {
      // User just completed the check-in. Show the confirmation once and
      // mark it seen for today so future remounts skip it.
      try {
        if (localStorage.getItem(todayKey) !== "1") {
          setConfirmationVisible(true);
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            setConfirmationVisible(false);
            try { localStorage.setItem(todayKey, "1"); } catch {}
          }, 2000);
        }
      } catch {
        // localStorage unavailable — still show the confirmation, just no persistence.
        setConfirmationVisible(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setConfirmationVisible(false), 2000);
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isCheckedIn, todayKey]);

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

    // Order lessons by week order_index then lesson order_index.
    // Exclude Week 0 ("The Liberated Path" workbook) — it's a reference
    // resource, not a lesson to complete, so it should never drive the
    // "Continue Your Journey" card.
    const orderedWeeks = [...weeks]
      .filter((w: any) => w.week_number !== 0 && w.title !== "The Liberated Path")
      .sort((a: any, b: any) => a.order_index - b.order_index);
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
  // Wraps the existing DailyCheckIn component as-is — no logic changes.
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

  // ============ STATE 1b: JUST CHECKED IN — minimal confirmation (2s) ============
  if (isCheckedIn && confirmationVisible && !isLoading) {
    return (
      <motion.div
        key="checkin-confirmation"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={fadeTransition}
      >
        <div
          className="dark-card-gradient rounded-[16px] text-white flex flex-col items-center justify-center"
          style={{ fontFamily: sansFont, padding: "20px 22px", minHeight: "110px" }}
        >
          <p
            className="uppercase text-center"
            style={{
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.12em",
              color: "#B8963F",
              marginBottom: "10px",
            }}
          >
            Daily Check-In
          </p>
          <Check size={32} strokeWidth={2.25} color="#B8963F" />
          <p
            className="text-center"
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#F5F3EE",
              marginTop: "8px",
              letterSpacing: "-0.01em",
            }}
          >
            Completed
          </p>
        </div>
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