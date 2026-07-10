import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useEntitlement = () => {
  const { user } = useAuth();

  const { data, isLoading, isFetching, isPending } = useQuery({
    queryKey: ["entitlement", user?.id],
    queryFn: async () => {
      if (!user) return { entitled: false, expired: false };

      // Verify we have a valid session before querying - if the JWT expired
      // the RLS-protected query returns empty results and we'd wrongly
      // redirect the user to the paywall.
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        // Session lost/expired - try to refresh it
        const { data: refreshed } = await supabase.auth.refreshSession();
        if (!refreshed.session) {
          // Truly no session - can't trust any query result
          throw new Error("Session expired");
        }
      }

      // Check entitlement
      const { data: entitlement, error } = await supabase
        .from("entitlements")
        .select("active, expires_at")
        .eq("user_id", user.id)
        .eq("entitlement_type", "course_app_access")
        .eq("active", true)
        .maybeSingle();

      if (error) {
        // Query failed (possibly auth issue) - don't assume "not entitled"
        throw new Error(error.message);
      }

      if (!entitlement) return { entitled: false, expired: false };

      // Check if expired
      const isExpired = entitlement.expires_at
        ? new Date(entitlement.expires_at) < new Date()
        : false;

      if (!isExpired) return { entitled: true, expired: false };

      // Expired - check if user has an active subscription
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("status, current_period_end")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .maybeSingle();

      if (subscription) {
        return { entitled: true, expired: false };
      }

      return { entitled: false, expired: true };
    },
    enabled: !!user,
    retry: 2,
    retryDelay: 1000,
  });

  // When query is disabled (no user), report as not loading
  // When query is enabled but hasn't resolved yet (or errored), report as loading
  // to prevent premature redirects
  const effectiveLoading = !user
    ? false
    : isPending || isLoading || isFetching;

  return {
    isEntitled: !!data?.entitled,
    isExpired: !!data?.expired,
    isLoading: effectiveLoading,
  };
};
