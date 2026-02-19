import { Home, Shield, Users, BookOpen } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";


const navItems = [
  { icon: Home, label: "Home", path: "/app" },
  { icon: Shield, label: "Armor", path: "/tools" },
  { icon: Users, label: "Brothers", path: "/brotherhood" },
  { icon: BookOpen, label: "Path", path: "/library" },
];

const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)', backgroundColor: '#0A0A0A', borderTop: '1px solid #C9A84C' }}>
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center justify-center min-w-[64px] py-2 px-3 transition-all duration-200"
              style={{ color: isActive ? '#C9A84C' : '#666666' }}
            >
              <item.icon className={cn("h-5 w-5 mb-1", isActive && "stroke-[2.5] fill-current")} />
              <span className={cn("text-xs font-medium", isActive && "font-semibold")}>
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
