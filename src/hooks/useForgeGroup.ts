/**
 * Named groups + "raise the banner" prayer requests — NEW features from the
 * Forge redesign (see src/features.ts: groups, statusDots).
 *
 * Tables: groups / group_members / prayer_requests / prayer_request_strength
 * (migrations 20260709*; not yet in generated types.ts, hence the casts).
 * The outreach message itself is composed over the existing chat DMs, using
 * the standard find-or-create conversation pattern.
 *
 * Falls back to the member's accepted 1:1 brotherhood connections when no
 * named group exists, so the UI stays alive for ungrouped members.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBrothers } from "@/hooks/useBrotherhood";
import { initialsOf } from "@/hooks/useForgeProfile";

export type BrotherStatus = "steady" | "struggling" | "away";

export interface ForgeBrother {
  id: string;
  name: string;
  initials: string;
  status: BrotherStatus;
}

export interface ForgeGroup {
  id: string;
  name: string;
  members: ForgeBrother[];
}

export interface BannerEvent {
  requestId: string;
  brotherId: string;
  name: string;
  initials: string;
  when: string;
  strengthened: boolean;
}

const DAY_MS = 86_400_000;

const memberIdsKey = (userId?: string) => ["forge-group", userId] as const;

/** The member's named group; falls back to their 1:1 brothers. */
export const useGroup = () => {
  const { user } = useAuth();
  const { brothers: connections, isLoading: brothersLoading } = useBrothers();

  return useQuery({
    // Keyed on user only — connections are queryFn inputs, not identity. Gating
    // on !brothersLoading stops the pipeline running once with [] then again
    // after brothers resolve.
    queryKey: memberIdsKey(user?.id),
    enabled: !!user && !brothersLoading,
    queryFn: async (): Promise<ForgeGroup | null> => {
      let groupId: string | null = null;
      let groupName = "The brotherhood";
      let memberIds: string[] = [];

      const { data: membership } = await (supabase as any)
        .from("group_members")
        .select("group_id, groups(id, name)")
        .eq("user_id", user!.id)
        .limit(1)
        .maybeSingle();

      if (membership?.group_id) {
        groupId = membership.group_id;
        groupName = membership.groups?.name ?? groupName;
        const { data: roster } = await (supabase as any)
          .from("group_members")
          .select("user_id")
          .eq("group_id", groupId);
        memberIds = (roster ?? []).map((r: { user_id: string }) => r.user_id);
      } else {
        memberIds = connections.map((b) => b.userId);
        if (memberIds.length === 0) return null;
        memberIds = [user!.id, ...memberIds];
        groupId = "brotherhood";
      }

      // Both depend only on memberIds — fetch in parallel.
      // "Struggling" = raised the banner in the last 24h. ("Away" needs
      // presence data other members can't read; it simply never occurs.)
      const dayAgo = new Date(Date.now() - DAY_MS).toISOString();
      const [{ data: profiles }, { data: recent }] = await Promise.all([
        supabase.rpc("get_profiles_directory", { _user_ids: memberIds }),
        (supabase as any)
          .from("prayer_requests")
          .select("user_id")
          .in("user_id", memberIds)
          .gte("sent_at", dayAgo),
      ]);
      const struggling = new Set((recent ?? []).map((r: { user_id: string }) => r.user_id));

      const members: ForgeBrother[] = memberIds.map((id) => {
        const p = (profiles ?? []).find((x: { user_id: string }) => x.user_id === id) as
          | { user_id: string; display_name: string | null; first_name: string | null }
          | undefined;
        const name = p?.display_name || p?.first_name || "Brother";
        return {
          id,
          name,
          initials: initialsOf(name),
          status: struggling.has(id) ? "struggling" : "steady",
        };
      });

      return { id: groupId!, name: groupName, members };
    },
  });
};

/** Latest banner raised by a brother (not me) in the last 48h. */
export const useBanner = () => {
  const { user } = useAuth();
  const { data: group } = useGroup();
  const memberIds = (group?.members ?? []).map((m) => m.id).filter((id) => id !== user?.id);

  return useQuery({
    queryKey: ["forge-banner", user?.id, memberIds.join(",")],
    enabled: !!user && memberIds.length > 0,
    queryFn: async (): Promise<BannerEvent | null> => {
      const twoDaysAgo = new Date(Date.now() - 2 * DAY_MS).toISOString();
      const { data: request } = await (supabase as any)
        .from("prayer_requests")
        .select("id, user_id, sent_at")
        .in("user_id", memberIds)
        .gte("sent_at", twoDaysAgo)
        .order("sent_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!request) return null;

      const { data: strength } = await (supabase as any)
        .from("prayer_request_strength")
        .select("user_id")
        .eq("request_id", request.id)
        .eq("user_id", user!.id)
        .maybeSingle();

      const brother = group?.members.find((m) => m.id === request.user_id);
      return {
        requestId: request.id,
        brotherId: request.user_id,
        name: brother?.name ?? "A brother",
        initials: brother?.initials ?? "LK",
        when: formatDistanceToNow(new Date(request.sent_at), { addSuffix: true }),
        strengthened: !!strength,
      };
    },
  });
};

const findOrCreateDm = async (myId: string, otherId: string): Promise<string | null> => {
  const { data: existing } = await supabase
    .from("chat_dms")
    .select("id")
    .or(`and(user_a.eq.${myId},user_b.eq.${otherId}),and(user_a.eq.${otherId},user_b.eq.${myId})`)
    .limit(1);
  if (existing && existing.length > 0) return existing[0].id;
  const [userA, userB] = [myId, otherId].sort();
  const { data: created, error } = await supabase
    .from("chat_dms")
    .insert({ user_a: userA, user_b: userB })
    .select("id")
    .single();
  if (error || !created) return null;
  return created.id;
};

const sendDm = async (myId: string, otherId: string, content: string) => {
  const dmId = await findOrCreateDm(myId, otherId);
  if (!dmId) return;
  await supabase.from("chat_messages").insert({ content, user_id: myId, dm_id: dmId });
};

/** "Send strength" on a brother's banner: mark it + a real DM to him. */
export const useSendStrength = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (banner: BannerEvent) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await (supabase as any)
        .from("prayer_request_strength")
        .upsert(
          { request_id: banner.requestId, user_id: user.id },
          { onConflict: "request_id,user_id" }
        );
      if (error) throw error;
      await sendDm(user.id, banner.brotherId, "Standing with you, brother. You're not alone in this.");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["forge-banner"] }),
  });
};

/** Raise the banner: one prayer_requests row + a real DM to each brother. */
export const useRaiseBanner = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ brotherIds, template }: { brotherIds: string[]; template: string }) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await (supabase as any)
        .from("prayer_requests")
        .insert({ user_id: user.id, template });
      if (error) throw error;
      // Crisis path: fan the DMs out in parallel so a 6-man group isn't
      // ~18 serial round trips while the man waits on the hold button.
      await Promise.all(brotherIds.map((brotherId) => sendDm(user.id, brotherId, template)));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forge-banner"] });
      qc.invalidateQueries({ queryKey: ["forge-week-stats"] });
    },
  });
};
