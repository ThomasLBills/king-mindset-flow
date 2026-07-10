import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isDevBypassEnabled } from "@/lib/devBypass";
import DevBypassBanner from "./DevBypassBanner";
import { Loader2 } from "lucide-react";

const OnboardingGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const bypass = isDevBypassEnabled();

  if (bypass) {
    return <>{children}</>;
  }

  const { data: profile, isLoading } = useQuery({
    queryKey: ["onboarding-check", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed, must_change_password")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.must_change_password) {
    return <Navigate to="/change-password" replace />;
  }

  if (profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default OnboardingGuard;
