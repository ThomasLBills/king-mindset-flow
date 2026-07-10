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
import { Eyebrow } from "@/components/forge/atoms";
import { LkMonogram } from "@/components/forge/brand";
import { PageBackdrop } from "@/components/forge/scenes";

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
    <div className="min-h-dvh flex bg-forge">
      {/* Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-line bg-sidebar transition-all duration-200",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-line">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <LkMonogram className="h-6 w-8 text-gold" />
              <h2 className="font-display text-lg font-bold uppercase tracking-wide text-bone">
                Admin
              </h2>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="h-8 w-8 text-dim hover:text-bone"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex-1 py-4 space-y-6 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <Eyebrow className="px-4 mb-2 block">{section.label}</Eyebrow>
              )}
              <div className="space-y-0.5 px-2">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "border-gold bg-raised-2 text-gold"
                          : "text-bone-2 hover:bg-raised-2/50 hover:text-bone"
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
        <div className="p-3 border-t border-line">
          <NavLink
            to="/app"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-dim transition-colors hover:bg-raised-2/50 hover:text-bone"
          >
            <ChevronLeft className="h-4 w-4" />
            {!collapsed && <span>Back to App</span>}
          </NavLink>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-forge-2 border-b border-line px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] flex items-center gap-3">
        <NavLink to="/app" aria-label="Back to app" className="text-dim transition-colors hover:text-bone">
          <ChevronLeft className="h-5 w-5" />
        </NavLink>
        <LkMonogram className="h-5 w-7 text-gold" />
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-bone">Admin</h2>
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 md:overflow-y-auto">
        <div className="md:hidden pt-[calc(3.5rem+env(safe-area-inset-top))]" />
        {/* pb-24 on mobile clears the fixed bottom nav; md resets it. */}
        <PageBackdrop className="p-4 pb-24 md:p-6">
          <Outlet />
        </PageBackdrop>
      </main>

      {/* Mobile bottom nav for admin */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-forge-2/95 backdrop-blur-lg border-t border-line pb-[env(safe-area-inset-bottom)]">
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
                  "flex flex-col items-center min-w-[56px] py-1.5 text-xs transition-colors",
                  isActive ? "text-gold font-semibold" : "text-dim hover:text-bone"
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
