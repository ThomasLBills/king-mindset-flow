import { Home, Shield, Users, BookOpen } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import NotificationBadge from "@/components/ui/notification-badge";
import { useUnread } from "@/contexts/UnreadContext";

const navItems = [
  { icon: Home, label: "Home", path: "/app" },
  { icon: Shield, label: "Armor", path: "/tools" },
  { icon: Users, label: "Brothers", path: "/brotherhood" },
  { icon: BookOpen, label: "Path", path: "/library" },
];

const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { counts } = useUnread();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)', backgroundColor: '#FFFFFF', borderTop: '1px solid #E5E5E5' }}>
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const showBadge = item.path === "/brotherhood" && counts.total > 0;
          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                window.scrollTo({ top: 0, left: 0 });
              }}
              className={cn(
                "relative flex flex-col items-center justify-center min-w-[64px] py-2 px-3 rounded-xl transition-all duration-200",
                isActive
                  ? "text-primary"
                  : "hover:opacity-70"
              )}
              style={!isActive ? { color: '#1C1C1E' } : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-secondary rounded-xl"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <div className="relative">
                <item.icon className={cn("relative z-10 h-5 w-5", isActive && "stroke-[2.5]")} />
                {showBadge && <NotificationBadge count={counts.total} />}
              </div>
              <span className={cn("relative z-10 text-xs font-medium mt-1", isActive && "font-semibold")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
