import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useEntitlement = () => {
  const { user } = useAuth();

  const { data: isEntitled, isLoading } = useQuery({
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

  return { isEntitled: !!isEntitled, isLoading };
};
