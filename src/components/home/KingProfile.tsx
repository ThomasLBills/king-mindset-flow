import { motion } from "framer-motion";
import { Shield, CalendarCheck, Heart, BookOpen, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useKingProfile } from "@/hooks/useKingProfile";
import { useFreedomStreak } from "@/hooks/useDailyProgress";

const KingProfile = () => {
  const {
    daysConsistent,
    supportConnections,
    breakthroughMoments,
    currentWeekNumber,
    totalWeeks,
    headline,
    daysFree,
    hasStreak,
  } = useKingProfile();

  const pillars = [
    { icon: CalendarCheck, label: "Days Consistent", value: daysConsistent },
    { icon: Sparkles, label: "Breakthroughs", value: breakthroughMoments },
    { icon: BookOpen, label: "Curriculum", value: `Wk ${currentWeekNumber}/${totalWeeks}`, isProgress: true },
    { icon: Heart, label: "Support Connections", value: supportConnections },
  ];

  const progressPercent = totalWeeks > 0 ? Math.round((currentWeekNumber / totalWeeks) * 100) : 0;

  return (
    <div className="rounded-2xl p-6 bg-[hsl(225_12%_8%)] text-white relative overflow-hidden -mx-6" style={{ borderRadius: 0, paddingLeft: "1.5rem", paddingRight: "1.5rem" }}>
      {/* Subtle gold glow */}
      {hasStreak && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at top right, hsl(40 44% 57% / 0.08) 0%, transparent 60%)",
          }}
        />
      )}

      {/* Header */}
      <div className="relative flex items-center gap-2 mb-3">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="font-serif text-lg font-semibold text-white">King Profile</h3>
      </div>

      {/* Dynamic Headline */}
      <motion.p
        key={headline}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative font-serif text-base text-primary font-semibold leading-relaxed mb-4"
      >
        {headline}
      </motion.p>

      {/* Five Pillar Stats Grid */}
      <div className="relative grid grid-cols-2 gap-3 mb-4">
        {pillars.map((pillar) => (
          <div
            key={pillar.label}
            className="rounded-xl p-3 flex flex-col gap-1.5"
          >
            <div className="flex items-center gap-2">
              <pillar.icon className="h-4 w-4 text-primary" />
              <span className="text-xs text-white font-medium">{pillar.label}</span>
            </div>
            {pillar.isProgress ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-lg font-semibold text-white">{pillar.value}</span>
                <Progress value={progressPercent} className="h-1.5 bg-primary/20" />
              </div>
            ) : (
              <span className="text-lg font-semibold text-white">{pillar.value}</span>
            )}
          </div>
        ))}
      </div>

      {/* Secondary streak metric */}
      <div className="relative flex items-center gap-2 pt-3 border-t border-white/10">
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
          <Shield className="h-3 w-3 text-primary" />
        </div>
        <span className="text-sm text-white">
          {daysFree === 0
            ? "Today is Day 1 of your freedom."
            : `${daysFree} ${daysFree === 1 ? "day" : "days"} walking in freedom.`}
        </span>
      </div>
    </div>
  );
};

export default KingProfile;
