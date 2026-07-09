import { Button } from "@/components/ui/button";
import { Users, CheckCircle, BookOpen, FileText, Plus, Loader2, TrendingUp, GraduationCap, BarChart3, Calendar, ShieldCheck } from "lucide-react";
import { useAdminEngagementStats } from "@/hooks/useAdminEngagement";
import { useWeeks, useCurriculumSettings } from "@/hooks/useAdminCurriculumNew";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Eyebrow, SectionCard } from "@/components/forge/atoms";

function useAdminCurriculumStats() {
  return useQuery({
    queryKey: ["admin-curriculum-stats"],
    queryFn: async () => {
      const [profiles, entitlements, weeks, lessons] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("entitlements").select("*", { count: "exact", head: true }).eq("active", true),
        supabase.from("weeks").select("*", { count: "exact", head: true }),
        supabase.from("curriculum_lessons").select("*", { count: "exact", head: true }).eq("status", "published"),
      ]);
      return {
        totalUsers: profiles.count || 0,
        activeEntitlements: entitlements.count || 0,
        totalWeeks: weeks.count || 0,
        publishedLessons: lessons.count || 0,
      };
    },
  });
}

const AdminDashboard = () => {
  const { data: stats, isLoading } = useAdminCurriculumStats();
  const { data: engagement, isLoading: engLoading } = useAdminEngagementStats();
  const navigate = useNavigate();

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers, icon: Users, color: "text-primary" },
    { label: "Active Subs", value: stats?.activeEntitlements, icon: CheckCircle, color: "text-success" },
    { label: "Weeks", value: stats?.totalWeeks, icon: Calendar, color: "text-accent" },
    { label: "Published Lessons", value: stats?.publishedLessons, icon: FileText, color: "text-primary" },
  ];

  return (
    <div className="space-y-8">
      <header>
        <Eyebrow className="mb-1 block">Overview</Eyebrow>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-dim">Manage your curriculum, users, and settings.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <SectionCard key={s.label} className="p-5 text-center">
            {isLoading ? (
              <Loader2 className="h-6 w-6 mx-auto animate-spin text-dim" />
            ) : (
              <>
                <s.icon className={`h-6 w-6 mx-auto mb-2 ${s.color}`} />
                <p className="font-display text-2xl font-bold text-bone">{s.value ?? 0}</p>
                <p className="text-sm text-dim">{s.label}</p>
              </>
            )}
          </SectionCard>
        ))}
      </div>

      {/* Engagement Stats */}
      <div>
        <Eyebrow className="mb-3 block">Engagement</Eyebrow>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Enrollments", value: engagement?.totalEnrollments, icon: GraduationCap, color: "text-accent" },
            { label: "Lessons Done", value: engagement?.lessonsCompleted, icon: TrendingUp, color: "text-success" },
            { label: "Completion Rate", value: engagement?.completionRate !== undefined ? `${engagement.completionRate}%` : undefined, icon: BarChart3, color: "text-primary", sublabel: "among active learners" },
          ].map((s) => (
            <SectionCard key={s.label} className="p-5 text-center">
              {engLoading ? (
                <Loader2 className="h-6 w-6 mx-auto animate-spin text-dim" />
              ) : (
                <>
                  <s.icon className={`h-6 w-6 mx-auto mb-2 ${s.color}`} />
                  <p className="font-display text-2xl font-bold text-bone">{s.value ?? 0}</p>
                  <p className="text-sm text-dim">{s.label}</p>
                  {"sublabel" in s && s.sublabel && (
                    <p className="text-xs text-dim/70 mt-0.5">{s.sublabel}</p>
                  )}
                </>
              )}
            </SectionCard>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <SectionCard className="p-6">
        <h3 className="font-display text-lg font-bold tracking-tight text-bone mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate("/admin/curriculum")} className="gap-2">
            <BookOpen className="h-4 w-4" /> Manage Curriculum
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin/announcements")} className="gap-2">
            <Plus className="h-4 w-4" /> New Announcement
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin/users")}>
            View Users
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin/entitlements")} className="gap-2">
            <ShieldCheck className="h-4 w-4" /> Entitlements
          </Button>
        </div>
      </SectionCard>
    </div>
  );
};

export default AdminDashboard;
