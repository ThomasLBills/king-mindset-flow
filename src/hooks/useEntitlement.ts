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
        .select("active")
        .eq("user_id", user.id)
        .eq("entitlement_type", "course_app_access")
        .eq("active", true)
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
    enabled: !!user,
  });

  // When query is disabled (no user), report as loading to prevent premature redirects
  const effectiveLoading = !user ? false : (isPending && !isFetching ? true : isLoading);

  return { isEntitled: !!isEntitled, isLoading: effectiveLoading };
};
