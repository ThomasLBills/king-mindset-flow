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
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        backgroundColor: '#1A1A1A',
        borderTop: '1px solid rgba(245, 243, 238, 0.06)',
      }}
    >
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
              className="relative flex flex-col items-center justify-center min-w-[64px] py-2 px-3 rounded-xl transition-all duration-200"
              style={{
                opacity: 1,
                color: isActive ? undefined : 'rgba(245, 243, 238, 0.35)',
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: "rgba(196, 162, 78, 0.1)" }}
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <div className="relative">
                <item.icon
                  className={cn("relative z-10 h-5 w-5", isActive && "stroke-[2.5]")}
                  style={isActive ? { color: "hsl(var(--primary))" } : undefined}
                />
                {showBadge && <NotificationBadge count={counts.total} />}
              </div>
              <span
                className={cn("relative z-10 mt-1")}
                style={{
                  fontSize: "10px",
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? "hsl(var(--primary))" : undefined,
                }}
              >
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
