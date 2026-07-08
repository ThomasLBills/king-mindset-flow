/**
 * Bridges the real auth/profile data into the display shape the Forge UI
 * was built around ({ name, firstName, initials, email, phone, timezone }).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ForgeUser {
  id: string;
  name: string;
  firstName: string;
  initials: string;
  email: string;
  phone?: string;
  timezone?: string;
}

export const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "LK";

export const useForgeUser = () => {
  const { user, loading: authLoading } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["forge-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, display_name, name, email, phone, timezone")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const forgeUser: ForgeUser | null = user
    ? (() => {
        const fullName =
          [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
          profile?.display_name ||
          profile?.name ||
          (user.user_metadata?.name as string | undefined) ||
          user.email?.split("@")[0] ||
          "Brother";
        return {
          id: user.id,
          name: fullName,
          firstName: profile?.first_name || fullName.split(/\s+/)[0],
          initials: initialsOf(profile?.display_name || fullName),
          email: profile?.email ?? user.email ?? "",
          phone: profile?.phone ?? undefined,
          timezone: profile?.timezone ?? undefined,
        };
      })()
    : null;

  return { user: forgeUser, loading: authLoading || (!!user && isLoading) };
};

export const useUpdateForgeProfile = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: { name?: string; phone?: string; timezone?: string }) => {
      if (!user) throw new Error("Not signed in");
      const update: Record<string, string | null> = {};
      if (patch.name?.trim()) {
        const parts = patch.name.trim().split(/\s+/);
        update.first_name = parts[0];
        update.last_name = parts.slice(1).join(" ") || null;
        update.display_name = patch.name.trim();
        update.name = patch.name.trim();
      }
      if (patch.phone !== undefined) update.phone = patch.phone || null;
      if (patch.timezone !== undefined) update.timezone = patch.timezone || null;
      const { error } = await supabase.from("profiles").update(update).eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["forge-profile"] }),
  });
};

/** Marks onboarding complete and refetches the guard's query before navigating. */
export const useCompleteOnboarding = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("user_id", user.id);
      if (error) throw error;
      await qc.refetchQueries({ queryKey: ["onboarding-check", user.id] });
    },
  });
};
