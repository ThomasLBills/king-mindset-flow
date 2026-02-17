import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const getLocalDate = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

// ========== CRISIS BUTTON LOGGING ==========
export function useCrisisEventLogger() {
  const { user } = useAuth();

  const logCrisisEvent = useMutation({
    mutationFn: async (selectedFeeling?: string) => {
      if (!user) return;
      await supabase.from("crisis_button_events").insert({
        user_id: user.id,
        triggered_at: new Date().toISOString(),
        selected_feeling: selectedFeeling ?? null,
      });
    },
  });

  return { logCrisisEvent };
}

// ========== RELAPSE EVENT LOGGING ==========
export function useRelapseEventLogger() {
  const { user } = useAuth();

  const logRelapseEvent = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const now = new Date();
      
      // Fetch recent emotions from last 48 hours of check-ins
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString().split("T")[0];
      const { data: recentCheckIns } = await supabase
        .from("daily_check_ins")
        .select("feelings")
        .eq("user_id", user.id)
        .gte("check_in_date", twoDaysAgo);

      const recentEmotions = recentCheckIns?.flatMap(c => c.feelings) ?? [];

      // Get enrollment date to calculate program day
      const { data: enrollment } = await supabase
        .from("user_enrollments")
        .select("enrolled_at")
        .eq("user_id", user.id)
        .maybeSingle();

      let programDay: number | null = null;
      if (enrollment?.enrolled_at) {
        const enrollDate = new Date(enrollment.enrolled_at);
        programDay = Math.floor((now.getTime() - enrollDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      await supabase.from("relapse_events").insert({
        user_id: user.id,
        relapsed_at: now.toISOString(),
        day_of_week: now.getDay(),
        program_day: programDay,
        recent_emotions: recentEmotions,
      });
    },
  });

  return { logRelapseEvent };
}

// ========== PATTERN INSIGHTS ==========

interface PatternInsight {
  id: string;
  pattern_type: string;
  title: string;
  message: string;
  scripture_reference: string;
  scripture_text: string;
  action_step: string;
  dismissed: boolean;
  dismissed_at: string | null;
  surfaced_at: string;
  created_at: string;
}

const PATTERN_SCRIPTURES: Record<string, { ref: string; text: string }> = {
  isolation: {
    ref: "Hebrews 10:24-25 (ESV)",
    text: "And let us consider how to stir up one another to love and good works, not neglecting to meet together, as is the habit of some, but encouraging one another, and all the more as you see the Day drawing near.",
  },
  evening_vulnerability: {
    ref: "Psalm 121:3-4 (ESV)",
    text: "He will not let your foot be moved; he who keeps you will not slumber. Behold, he who keeps Israel will neither slumber nor sleep.",
  },
  disconnection: {
    ref: "Ecclesiastes 4:9-10 (ESV)",
    text: "Two are better than one, because they have a good reward for their toil. For if they fall, one will lift up his fellow. But woe to him who is alone when he falls and has not another to lift him up!",
  },
  emotion_trigger: {
    ref: "Psalm 139:23-24 (ESV)",
    text: "Search me, O God, and know my heart! Try me and know my thoughts! And see if there be any grievous way in me, and lead me in the way everlasting!",
  },
  day_pattern: {
    ref: "Ephesians 5:15-16 (ESV)",
    text: "Look carefully then how you walk, not as unwise but as wise, making the best use of the time, because the days are evil.",
  },
};

export function useTriggerPatterns() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const today = getLocalDate();

  // Fetch active (undismissed) insight
  const { data: activeInsight, isLoading: insightLoading } = useQuery({
    queryKey: ["pattern-insight-active", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("pattern_insights")
        .select("*")
        .eq("user_id", user!.id)
        .eq("dismissed", false)
        .order("surfaced_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as PatternInsight | null;
    },
  });

  // Fetch all insights (for history)
  const { data: allInsights = [], isLoading: historyLoading } = useQuery({
    queryKey: ["pattern-insights-all", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("pattern_insights")
        .select("*")
        .eq("user_id", user!.id)
        .order("surfaced_at", { ascending: false });
      return (data ?? []) as PatternInsight[];
    },
  });

  // Dismiss an insight
  const dismissInsight = useMutation({
    mutationFn: async (insightId: string) => {
      await supabase
        .from("pattern_insights")
        .update({ dismissed: true, dismissed_at: new Date().toISOString() })
        .eq("id", insightId)
        .eq("user_id", user!.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pattern-insight-active"] });
      qc.invalidateQueries({ queryKey: ["pattern-insights-all"] });
    },
  });

  // Run pattern analysis (called after check-in completes)
  const analyzePatterns = useMutation({
    mutationFn: async () => {
      if (!user) return;

      // TIMING RULE: Check if relapse happened today (give grace)
      const { data: todayRelapse } = await supabase
        .from("relapse_events")
        .select("id")
        .eq("user_id", user.id)
        .gte("relapsed_at", today + "T00:00:00")
        .limit(1);
      if (todayRelapse && todayRelapse.length > 0) return;

      // TIMING RULE: Check last insight was surfaced > 7 days ago
      const { data: lastInsight } = await supabase
        .from("pattern_insights")
        .select("surfaced_at")
        .eq("user_id", user.id)
        .order("surfaced_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastInsight) {
        const lastDate = new Date(lastInsight.surfaced_at);
        const daysSince = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < 7) return;
      }

      // TIMING RULE: Need 14+ days of check-in data
      const { data: checkIns } = await supabase
        .from("daily_check_ins")
        .select("check_in_date, feelings, created_at")
        .eq("user_id", user.id)
        .order("check_in_date", { ascending: false });

      if (!checkIns || checkIns.length < 14) return;

      // Fetch relapse events
      const { data: relapses } = await supabase
        .from("relapse_events")
        .select("relapsed_at, day_of_week, recent_emotions")
        .eq("user_id", user.id)
        .order("relapsed_at", { ascending: false });

      // Fetch crisis events
      const { data: crisisEvents } = await supabase
        .from("crisis_button_events")
        .select("triggered_at, selected_feeling")
        .eq("user_id", user.id)
        .order("triggered_at", { ascending: false });

      // Fetch brotherhood activity
      const { data: brotherhoodActivity } = await supabase
        .from("chat_messages")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const insight = detectPattern(
        checkIns ?? [],
        relapses ?? [],
        crisisEvents ?? [],
        brotherhoodActivity ?? []
      );

      if (insight) {
        await supabase.from("pattern_insights").insert({
          user_id: user.id,
          pattern_type: insight.type,
          title: "The Spirit may be showing you something.",
          message: insight.message,
          scripture_reference: insight.scripture.ref,
          scripture_text: insight.scripture.text,
          action_step: insight.actionStep,
        });

        qc.invalidateQueries({ queryKey: ["pattern-insight-active"] });
        qc.invalidateQueries({ queryKey: ["pattern-insights-all"] });
      }
    },
  });

  return {
    activeInsight,
    allInsights,
    insightLoading,
    historyLoading,
    dismissInsight,
    analyzePatterns,
  };
}

// ========== PATTERN DETECTION ENGINE ==========

interface CheckInRecord {
  check_in_date: string;
  feelings: string[];
  created_at: string;
}

interface RelapseRecord {
  relapsed_at: string;
  day_of_week: number | null;
  recent_emotions: string[] | null;
}

interface CrisisRecord {
  triggered_at: string;
  selected_feeling: string | null;
}

interface DetectedPattern {
  type: string;
  message: string;
  scripture: { ref: string; text: string };
  actionStep: string;
}

function detectPattern(
  checkIns: CheckInRecord[],
  relapses: RelapseRecord[],
  crisisEvents: CrisisRecord[],
  brotherhoodMessages: { created_at: string }[]
): DetectedPattern | null {
  // 1. EMOTION + RELAPSE CORRELATION
  if (relapses.length >= 2) {
    const emotionCounts: Record<string, number> = {};
    for (const relapse of relapses) {
      if (relapse.recent_emotions) {
        for (const emotion of relapse.recent_emotions) {
          emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        }
      }
    }
    const topEmotion = Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a)[0];

    if (topEmotion && topEmotion[1] >= 3) {
      const emotionLabel = topEmotion[0].charAt(0).toUpperCase() + topEmotion[0].slice(1);
      return {
        type: "emotion_trigger",
        message: `You have checked in feeling ${emotionLabel} before ${topEmotion[1]} of your last difficult moments. ${emotionLabel} may be your primary trigger.`,
        scripture: PATTERN_SCRIPTURES.emotion_trigger,
        actionStep: `When you notice "${emotionLabel}" rising, pause and use the I Need Strength button before the feeling builds. Name it early.`,
      };
    }
  }

  // 2. DAY OF WEEK PATTERN
  if (relapses.length >= 2 || crisisEvents.length >= 3) {
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayCounts: Record<number, number> = {};

    for (const r of relapses) {
      if (r.day_of_week !== null) {
        dayCounts[r.day_of_week] = (dayCounts[r.day_of_week] || 0) + 1;
      }
    }
    for (const c of crisisEvents) {
      const day = new Date(c.triggered_at).getDay();
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    }

    const topDay = Object.entries(dayCounts)
      .sort(([, a], [, b]) => b - a)[0];

    if (topDay && parseInt(topDay[1] as any) >= 3) {
      const dayName = dayNames[parseInt(topDay[0])];
      return {
        type: "day_pattern",
        message: `${dayName}s have been your most vulnerable time over the last few weeks. Consider building a plan for that window.`,
        scripture: PATTERN_SCRIPTURES.day_pattern,
        actionStep: `Before next ${dayName}, set a reminder to connect with a brother or plan an activity that fills the space where temptation usually enters.`,
      };
    }
  }

  // 3. TIME OF DAY PATTERN
  if (crisisEvents.length >= 3) {
    const hourBuckets: Record<string, number> = {};
    for (const c of crisisEvents) {
      const hour = new Date(c.triggered_at).getHours();
      let bucket: string;
      if (hour >= 5 && hour < 12) bucket = "morning";
      else if (hour >= 12 && hour < 17) bucket = "afternoon";
      else if (hour >= 17 && hour < 21) bucket = "evening";
      else bucket = "late night";
      hourBuckets[bucket] = (hourBuckets[bucket] || 0) + 1;
    }

    const topBucket = Object.entries(hourBuckets)
      .sort(([, a], [, b]) => b - a)[0];

    if (topBucket && topBucket[1] >= 3) {
      return {
        type: "evening_vulnerability",
        message: `The ${topBucket[0]} hours have been your most vulnerable time. You have used the I Need Strength button ${topBucket[1]} times during this window.`,
        scripture: PATTERN_SCRIPTURES.evening_vulnerability,
        actionStep: `Build a ${topBucket[0]} routine that redirects your energy. Call a brother, go for a walk, or open your journal during this window.`,
      };
    }
  }

  // 4. ISOLATION PATTERN
  const recentCheckIns = checkIns.slice(0, 7);
  const isolationCount = recentCheckIns.filter(c =>
    c.feelings.includes("isolated") || c.feelings.includes("discouraged")
  ).length;

  if (isolationCount >= 3) {
    const lastBrotherhoodMessage = brotherhoodMessages[0];
    const daysSinceConnection = lastBrotherhoodMessage
      ? Math.floor((Date.now() - new Date(lastBrotherhoodMessage.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (daysSinceConnection >= 5) {
      return {
        type: "disconnection",
        message: `You have not connected with a brother in ${daysSinceConnection >= 999 ? "a while" : `${daysSinceConnection} days`}. Connection is the opposite of addiction.`,
        scripture: PATTERN_SCRIPTURES.disconnection,
        actionStep: "Open the Brotherhood tab right now and send a message to one brother. Even a simple 'How are you doing?' breaks the isolation.",
      };
    }

    return {
      type: "isolation",
      message: `You have checked in feeling Isolated or Discouraged ${isolationCount} times in the last 7 days. Isolation may be creating space for the enemy to work.`,
      scripture: PATTERN_SCRIPTURES.isolation,
      actionStep: "Reach out to one brother today. You do not have to share everything. Just let someone know you are walking through a hard season.",
    };
  }

  return null;
}
