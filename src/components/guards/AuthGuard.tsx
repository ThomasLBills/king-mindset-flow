import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { isDevBypassEnabled } from "@/lib/devBypass";
import DevBypassBanner from "./DevBypassBanner";
import { Loader2 } from "lucide-react";

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const bypass = isDevBypassEnabled();

  if (bypass) {
    return <><DevBypassBanner /><div className="pt-6">{children}</div></>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
