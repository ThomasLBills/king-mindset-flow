/**
 * Maps the real curriculum (weeks / curriculum_lessons / progress /
 * enrollment / drip settings) into the shapes the Forge Grow + Today screens
 * render. Unlock rules mirror the original production app: the first week
 * is always open, the rest unlock by enrollment day offset (or all at once
 * in "immediate" drip mode).
 */
import { addDays, differenceInCalendarDays, format } from "date-fns";
import {
  useAllPublishedCurriculumLessons,
  useCurriculumLessonProgress,
  useCurriculumSettings,
  usePublishedWeeks,
  useUserEnrollment,
} from "@/hooks/useCurriculum";

export interface ForgeLessonSummary {
  id: string;
  title: string;
  minutes: number;
  done: boolean;
}

export interface ForgeWeek {
  id: string;
  number: number;
  title: string;
  theme: string;
  locked: boolean;
  isWorkbook: boolean;
  /** e.g. "Jul 15" for locked weeks, matching the original Library */
  unlocksAt?: string;
  lessons: ForgeLessonSummary[];
}

export const useForgeWeeks = () => {
  const settingsQ = useCurriculumSettings();
  const weeksQ = usePublishedWeeks();
  const lessonsQ = useAllPublishedCurriculumLessons();
  const progressQ = useCurriculumLessonProgress();
  const enrollmentQ = useUserEnrollment();

  const { data: settings } = settingsQ;
  const { data: weeks } = weeksQ;
  const { data: allLessons } = lessonsQ;
  const { data: progressMap } = progressQ;
  const { data: enrollment } = enrollmentQ;

  const isLoading =
    settingsQ.isLoading ||
    weeksQ.isLoading ||
    lessonsQ.isLoading ||
    progressQ.isLoading ||
    enrollmentQ.isLoading;

  // Surface a load failure so Grow/Lesson can render <ErrorState onRetry>.
  const isError =
    settingsQ.isError ||
    weeksQ.isError ||
    lessonsQ.isError ||
    progressQ.isError ||
    enrollmentQ.isError;

  const refetch = () => {
    void settingsQ.refetch();
    void weeksQ.refetch();
    void lessonsQ.refetch();
    void progressQ.refetch();
    void enrollmentQ.refetch();
  };

  const daysSinceEnrollment = enrollment
    ? differenceInCalendarDays(new Date(), new Date(enrollment.enrolled_at))
    : -1;
  const dripMode = settings?.drip_mode || "weekly";

  const data: ForgeWeek[] | undefined =
    weeks && allLessons
      ? weeks.map((week, index) => {
          const unlocked =
            index === 0 ||
            (!!enrollment &&
              (dripMode === "immediate" || daysSinceEnrollment >= week.unlock_day_offset));
          return {
            id: week.id,
            number: week.week_number,
            title: week.title,
            theme: week.summary ?? "",
            locked: !unlocked,
            isWorkbook: week.week_number === 0,
            unlocksAt:
              !unlocked && enrollment
                ? format(addDays(new Date(enrollment.enrolled_at), week.unlock_day_offset), "MMM d")
                : undefined,
            lessons: allLessons
              .filter((l) => l.week_id === week.id)
              .map((l) => ({
                id: l.id,
                title: l.title,
                minutes: l.duration_minutes ?? 0,
                done: progressMap?.get(l.id)?.status === "completed",
              })),
          };
        })
      : undefined;

  return { data, isLoading, isError, refetch };
};

/** First incomplete lesson in an unlocked week, in curriculum order. */
export const useNextLesson = () => {
  const { data: weeks, isLoading } = useForgeWeeks();
  const next = weeks
    ?.filter((w) => !w.locked)
    .flatMap((w) => w.lessons.map((l) => ({ ...l, weekNumber: w.number, weekTitle: w.title })))
    .find((l) => !l.done);
  return { data: next ?? null, isLoading };
};
