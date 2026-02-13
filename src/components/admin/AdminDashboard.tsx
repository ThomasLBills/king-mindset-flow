import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle, BookOpen, FileText, Plus, Loader2 } from "lucide-react";
import { useAdminStats } from "@/hooks/useAdminCurriculum";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const AdminDashboard = () => {
  const { data: stats, isLoading } = useAdminStats();
  const navigate = useNavigate();

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers, icon: Users, color: "text-primary" },
    { label: "Active Subs", value: stats?.activeEntitlements, icon: CheckCircle, color: "text-success" },
    { label: "Courses", value: stats?.totalCourses, icon: BookOpen, color: "text-accent" },
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

      {/* Quick Actions */}
      <Card className="card-elevated">
        <CardContent className="pt-6">
          <h3 className="font-serif text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate("/admin/courses?new=1")} className="gap-2">
              <Plus className="h-4 w-4" /> New Course
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/announcements?new=1")} className="gap-2">
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
