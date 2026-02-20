import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlement } from "@/hooks/useEntitlement";
import { Loader2 } from "lucide-react";

const Landing = () => {
  const { user, loading: authLoading } = useAuth();
  const { isEntitled, isLoading: entLoading } = useEntitlement();

  if (authLoading || (user && entLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user && isEntitled) {
    return <Navigate to="/app" replace />;
  }

  if (user) {
    return <Navigate to="/upgrade" replace />;
  }

  return <Navigate to="/login" replace />;
};

export default Landing;
