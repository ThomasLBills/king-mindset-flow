import { ReactNode, useEffect, useRef } from "react";
import MobileNav from "./MobileNav";
import UserMenu from "./UserMenu";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { user } = useAuth();
  const lastPingRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    if (lastPingRef.current === today) return;
    lastPingRef.current = today;
    supabase
      .from("profiles")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .then();
  }, [user]);
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-[rgba(26,26,26,0.06)]">
        <div className="flex items-center justify-end px-4 py-3">
          <UserMenu />
        </div>
      </header>
      {/* divider handled by header border */}
      <main className="pb-28">
        {children}
      </main>
      <MobileNav />
    </div>
  );
};

export default AppLayout;
