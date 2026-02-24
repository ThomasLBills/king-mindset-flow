import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useEntitlement = () => {
  const { user } = useAuth();

  const { data: isEntitled, isLoading, isFetching, isPending } = useQuery({
    queryKey: ["entitlement", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("entitlements")
        .select("active, expires_at")
        .eq("user_id", user.id)
        .eq("entitlement_type", "course_app_access")
        .eq("active", true)
        .maybeSingle();
      if (error || !data) return false;
      // Check if entitlement has expired
      if (data.expires_at && new Date(data.expires_at) <= new Date()) {
        return false;
      }
      return true;
    },
    enabled: !!user,
  });

  // When query is disabled (no user), report as loading to prevent premature redirects
  const effectiveLoading = !user ? false : (isPending && !isFetching ? true : isLoading);

  return { isEntitled: !!isEntitled, isLoading: effectiveLoading };
};
