import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface ArmorStats {
  this_week_count: number;
  last_week_count: number;
  engaged_users: number;
  total_users: number;
  all_time_count: number;
}

export function useCommunityArmor() {
  const { user } = useAuth();

  return useQuery<ArmorStats>({
    queryKey: ["community-armor-stats"],
    enabled: !!user,
    refetchInterval: 30_000, // poll every 30s for near-realtime
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_community_armor_stats");
      if (error) throw error;
      return data as unknown as ArmorStats;
    },
  });
}
