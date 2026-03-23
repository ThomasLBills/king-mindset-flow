import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle, BookOpen, FileText, Plus, Loader2, TrendingUp, GraduationCap, BarChart3, Calendar } from "lucide-react";
import { useAdminEngagementStats } from "@/hooks/useAdminEngagement";
import { useWeeks, useCurriculumSettings } from "@/hooks/useAdminCurriculumNew";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

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
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage your curriculum, users, and settings.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="card-elevated">
            <CardContent className="pt-6 text-center">
              {isLoading ? (
                <Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
              ) : (
                <>
                  <s.icon className={`h-6 w-6 mx-auto mb-2 ${s.color}`} />
                  <p className="text-2xl font-bold">{s.value ?? 0}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Engagement Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Enrollments", value: engagement?.totalEnrollments, icon: GraduationCap, color: "text-accent" },
          { label: "Lessons Done", value: engagement?.lessonsCompleted, icon: TrendingUp, color: "text-success" },
          { label: "Completion Rate", value: engagement?.completionRate !== undefined ? `${engagement.completionRate}%` : undefined, icon: BarChart3, color: "text-primary", sublabel: "among active learners" },
        ].map((s) => (
          <Card key={s.label} className="card-elevated">
            <CardContent className="pt-6 text-center">
              {engLoading ? (
                <Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
              ) : (
                <>
                  <s.icon className={`h-6 w-6 mx-auto mb-2 ${s.color}`} />
                  <p className="text-2xl font-bold">{s.value ?? 0}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  {"sublabel" in s && s.sublabel && (
                    <p className="text-xs text-muted-foreground/70 mt-0.5">{s.sublabel}</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="card-elevated">
        <CardContent className="pt-6">
          <h3 className="font-serif text-lg font-semibold mb-4">Quick Actions</h3>
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
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminDashboard;
