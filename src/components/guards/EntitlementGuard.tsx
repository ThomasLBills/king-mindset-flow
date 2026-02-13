import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlement } from "@/hooks/useEntitlement";
import { isDevBypassEnabled } from "@/lib/devBypass";
import DevBypassBanner from "./DevBypassBanner";
import { Loader2 } from "lucide-react";

const EntitlementGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { isEntitled, isLoading: entitlementLoading } = useEntitlement();
  const bypass = isDevBypassEnabled();

  if (bypass) {
    return <><DevBypassBanner /><div className="pt-6">{children}</div></>;
  }

  if (authLoading || entitlementLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isEntitled) {
    return <Navigate to="/upgrade" replace />;
  }

  return <>{children}</>;
};

export default EntitlementGuard;
