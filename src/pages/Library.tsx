import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { ChevronRight, Check, BookOpen, Play, Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  usePublishedWeeks,
  useAllPublishedCurriculumLessons,
  useCurriculumLessonProgress,
  useUserEnrollment,
  useCurriculumSettings,
} from "@/hooks/useCurriculum";
import { useAuth } from "@/hooks/useAuth";
import { differenceInCalendarDays, addDays, format } from "date-fns";

const sansFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

const LibraryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: settings, isLoading: settingsLoading } = useCurriculumSettings();
  const { data: weeks, isLoading: weeksLoading } = usePublishedWeeks();
  const { data: allLessons, isLoading: lessonsLoading } = useAllPublishedCurriculumLessons();
  const { data: progressMap } = useCurriculumLessonProgress();
  const { data: enrollment } = useUserEnrollment();

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
    ? differenceInCalendarDays(new Date(), new Date(enrollment.enrolled_at))
    : -1;

  const dripMode = settings?.drip_mode || "weekly";

  const isWeekUnlocked = (week: any, index: number) => {
    if (index === 0) return true;
    if (!enrollment) return false;
    if (dripMode === "immediate") return true;
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

  const currentWeekId = weeks?.find((w, i) => isWeekUnlocked(w, i) && !isWeekCompleted(w.id))?.id;

  return (
    <AppLayout>
      <div style={{ padding: "24px 16px", fontFamily: sansFont }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <p style={{
            fontFamily: sansFont,
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#B8963F",
            marginBottom: 4,
          }}>
            Your Liberation Curriculum
          </p>
          <h1 style={{
            fontFamily: sansFont,
            fontWeight: 600,
            fontStyle: "normal",
            fontSize: 26,
            letterSpacing: "-0.02em",
            color: "#1A1A1A",
            margin: "0 0 4px 0",
          }}>
            Liberated Kings
          </h1>
          <p style={{
            fontFamily: sansFont,
            fontWeight: 400,
            fontSize: 15,
            color: "rgba(26, 26, 26, 0.6)",
            margin: 0,
          }}>
            Eight weeks. One transformation.
          </p>
        </motion.div>

        {/* Overall Progress */}
        {(enrollment || user) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{
                fontFamily: sansFont,
                fontSize: 14,
                fontWeight: 500,
                color: "#1A1A1A",
              }}>Journey Progress</span>
              <span style={{
                fontFamily: sansFont,
                fontSize: 14,
                fontWeight: 400,
                color: "rgba(26, 26, 26, 0.5)",
              }}>{completedLessons}/{totalLessons} lessons</span>
            </div>
            <div style={{
              width: "100%",
              height: 4,
              borderRadius: 2,
              background: "rgba(26, 26, 26, 0.1)",
              overflow: "hidden",
            }}>
              <div style={{
                width: `${overallProgress}%`,
                height: "100%",
                borderRadius: 2,
                background: "#B8963F",
                transition: "width 0.5s ease",
              }} />
            </div>
          </motion.div>
        )}

        {/* Weeks */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {(weeks ?? []).map((week, index) => {
            const unlocked = isWeekUnlocked(week, index);
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
                  onClick={() => {
                    if (unlocked) {
                      setExpandedWeek(expandedWeek === week.id ? null : week.id);
                    }
                  }}
                  disabled={!unlocked && index !== 0}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "18px 20px",
                    borderRadius: isCurrent ? "0 14px 14px 0" : 14,
                    background: "#1A1A1A",
                    border: "none",
                    outline: "none",
                    boxShadow: "none",
                    borderLeft: isCurrent ? "3px solid #B8963F" : "none",
                    opacity: !unlocked && !completed ? 0.5 : 1,
                    cursor: unlocked ? "pointer" : "default",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    fontFamily: sansFont,
                  }}
                >
                  {/* Icon container */}
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: completed
                      ? "rgba(196, 162, 78, 0.12)"
                      : isCurrent
                        ? "rgba(196, 162, 78, 0.2)"
                        : "rgba(245, 243, 238, 0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {completed ? (
                      <Check style={{ width: 18, height: 18, color: "#B8963F" }} />
                    ) : isCurrent ? (
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#B8963F" }} />
                    ) : (
                      <Lock style={{ width: 16, height: 16, color: "rgba(245, 243, 238, 0.3)" }} />
                    )}
                  </div>

                  {/* Text content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      fontFamily: sansFont,
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#B8963F",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      display: "block",
                      marginBottom: 2,
                    }}>
                      Week {week.week_number}{isCurrent ? " — Current" : ""}
                    </span>
                    <h3 style={{
                      fontFamily: sansFont,
                      fontWeight: 600,
                      fontStyle: "normal",
                      fontSize: 16,
                      color: "#F5F3EE",
                      margin: 0,
                      lineHeight: 1.3,
                    }}>
                      {week.title}
                    </h3>
                    {week.summary && (
                      <p style={{
                        fontFamily: sansFont,
                        fontSize: 13,
                        fontWeight: 400,
                        color: "#F5F3EE",
                        margin: "4px 0 0 0",
                        lineHeight: 1.4,
                      }}>
                        {week.summary}
                      </p>
                    )}
                    {unlocked && weekProgress > 0 && weekProgress < 100 && (
                      <div style={{
                        marginTop: 8,
                        width: "100%",
                        height: 3,
                        borderRadius: 2,
                        background: "rgba(245, 243, 238, 0.1)",
                        overflow: "hidden",
                      }}>
                        <div style={{
                          width: `${weekProgress}%`,
                          height: "100%",
                          borderRadius: 2,
                          background: "#B8963F",
                          transition: "width 0.5s ease",
                        }} />
                      </div>
                    )}
                  </div>

                  {/* Chevron for unlocked incomplete weeks */}
                  {unlocked && !completed && (
                    <ChevronRight
                      style={{
                        width: 18,
                        height: 18,
                        color: "#B8963F",
                        flexShrink: 0,
                        transform: expandedWeek === week.id ? "rotate(90deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                      }}
                    />
                  )}

                  {/* Lock date for locked weeks */}
                  {!unlocked && !completed && enrollment && (
                    <span style={{
                      fontFamily: sansFont,
                      fontSize: 10,
                      color: "rgba(245, 243, 238, 0.4)",
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                    }}>
                      {format(addDays(new Date(enrollment.enrolled_at), week.unlock_day_offset), "MMM d")}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {expandedWeek === week.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div style={{ paddingTop: 8, paddingLeft: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                        {lessons.length === 0 ? (
                          <p style={{
                            fontFamily: sansFont,
                            fontSize: 14,
                            color: "rgba(245, 243, 238, 0.5)",
                            fontStyle: "italic",
                          }}>No lessons published yet.</p>
                        ) : (
                          lessons.map((lesson) => {
                            const lp = progressMap?.get(lesson.id);
                            const isComplete = lp?.status === "completed";
                            return (
                              <button
                                key={lesson.id}
                                onClick={() => navigate(`/library/lesson/${lesson.id}`)}
                                style={{
                                  width: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                  padding: "14px 16px",
                                  borderRadius: 12,
                                  background: "#242424",
                                  border: "none",
                                  outline: "none",
                                  boxShadow: "none",
                                  cursor: "pointer",
                                  fontFamily: sansFont,
                                  textAlign: "left",
                                }}
                              >
                                <div style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  background: isComplete ? "rgba(196, 162, 78, 0.12)" : "rgba(184, 150, 63, 0.1)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}>
                                  {isComplete ? (
                                    <Check style={{ width: 14, height: 14, color: "#B8963F" }} />
                                  ) : lesson.video_url ? (
                                    <Play style={{ width: 14, height: 14, color: "#B8963F" }} />
                                  ) : (
                                    <BookOpen style={{ width: 14, height: 14, color: "#B8963F" }} />
                                  )}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <span style={{
                                    fontFamily: sansFont,
                                    fontSize: 14,
                                    fontWeight: 500,
                                    color: "#F5F3EE",
                                    display: "block",
                                  }}>{lesson.title}</span>
                                  <span style={{
                                    fontFamily: sansFont,
                                    fontSize: 12,
                                    fontWeight: 400,
                                    color: "rgba(245, 243, 238, 0.4)",
                                  }}>
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
