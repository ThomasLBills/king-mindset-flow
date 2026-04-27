import { NavLink, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  MessageSquare,
  Settings,
  ScrollText,
  Megaphone,
  ChevronLeft,
  Menu,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navSections = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
      { label: "Audit Log", path: "/admin/audit-log", icon: ScrollText },
    ],
  },
  {
    label: "Curriculum",
    items: [
      { label: "Curriculum", path: "/admin/curriculum", icon: BookOpen },
      { label: "Announcements", path: "/admin/announcements", icon: Megaphone },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Users", path: "/admin/users", icon: Users },
      { label: "Entitlements", path: "/admin/entitlements", icon: ShieldCheck },
      { label: "Community", path: "/admin/community", icon: MessageSquare },
    ],
  },
  {
    label: "Config",
    items: [
      { label: "Settings", path: "/admin/settings", icon: Settings },
    ],
  },
];

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-sidebar transition-all duration-200",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!collapsed && (
            <h2 className="font-serif text-lg font-bold text-sidebar-foreground">Admin</h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sidebar-foreground"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex-1 py-4 space-y-6 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5 px-2">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Back to app */}
        <div className="p-3 border-t border-border">
          <NavLink
            to="/app"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {!collapsed && <span>Back to App</span>}
          </NavLink>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <NavLink to="/app" className="text-muted-foreground">
          <ChevronLeft className="h-5 w-5" />
        </NavLink>
        <h2 className="font-serif text-lg font-bold">Admin</h2>
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 md:overflow-y-auto">
        <div className="md:hidden pt-14" />
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav for admin */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border">
        <div className="flex items-center justify-around px-2 py-2">
          {[
            { icon: LayoutDashboard, label: "Home", path: "/admin", end: true },
            { icon: Users, label: "Users", path: "/admin/users" },
            { icon: ShieldCheck, label: "Access", path: "/admin/entitlements" },
            { icon: BookOpen, label: "Curriculum", path: "/admin/curriculum" },
            { icon: Settings, label: "Settings", path: "/admin/settings" },
          ].map((item) => {
            const isActive = item.end
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={cn(
                  "flex flex-col items-center min-w-[56px] py-1.5 text-xs",
                  isActive ? "text-primary font-semibold" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5 mb-0.5" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AdminLayout;
