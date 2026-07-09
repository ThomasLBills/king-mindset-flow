/**
 * Dashboard KPIs. Aggregate-only, by design: this app removed all streak/shame
 * mechanics, so nothing here is ever a per-user relapse scoreboard. relapse_events
 * is deliberately NOT read. Stand-Firm usage comes from a SECURITY DEFINER
 * aggregate RPC (counts per day, never rows) - see ADMIN_RUNBOOK.md section 2;
 * if that RPC is not yet applied the card degrades gracefully to "unavailable".
 *
 * Counts use head:true (no row transfer). Deltas compare the selected range to
 * the immediately-preceding range of equal length, and only where the source
 * timestamp is immutable (signups, messages) - metrics derived from a mutable
 * "last seen" are shown as point-in-time with no misleading delta.
 */
import { useQuery } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export type RangeDays = 7 | 30 | 90;

const iso = (d: Date) => d.toISOString();

/** head:true count of `table` where `col` is in [start, end). */
async function countBetween(table: string, col: string, start: string, end?: string) {
  let q = supabase.from(table as never).select("*", { count: "exact", head: true }).gte(col, start) as never;
  if (end) q = (q as { lt: (c: string, v: string) => never }).lt(col, end);
  const { count } = (await (q as unknown as Promise<{ count: number | null }>));
  return count ?? 0;
}

async function crisisTrend(days: number): Promise<{ day: string; count: number }[] | null> {
  try {
    const { data, error } = await supabase.rpc("get_crisis_button_trend" as never, { _days: days } as never);
    if (error) return null;
    return (data ?? []) as { day: string; count: number }[];
  } catch {
    return null; // RPC not deployed yet
  }
}

export interface AdminKpis {
  signups: { current: number; prior: number; series: number[] };
  wau: number;
  mau: number;
  activeEntitlements: number;
  newGrants: number;
  cancelling: number;
  atRisk: number;
  brotherhood: { current: number; prior: number };
  standFirm: { total: number; series: { day: string; count: number }[] } | null;
}

export function useAdminKpis(range: RangeDays) {
  return useQuery({
    queryKey: ["admin-kpis", range],
    queryFn: async (): Promise<AdminKpis> => {
      const now = new Date();
      const startCur = iso(subDays(now, range));
      const startPrior = iso(subDays(now, range * 2));
      const start7 = iso(subDays(now, 7));
      const start30 = iso(subDays(now, 30));
      const at14 = iso(subDays(now, 14));

      const [
        signupsCur,
        signupsPrior,
        wau,
        mau,
        activeEntitlements,
        newGrants,
        cancelling,
        atRisk,
        broCur,
        broPrior,
        signupRows,
        standTrend,
      ] = await Promise.all([
        countBetween("profiles", "created_at", startCur),
        countBetween("profiles", "created_at", startPrior, startCur),
        countBetween("profiles", "last_seen_at", start7),
        countBetween("profiles", "last_seen_at", start30),
        supabase.from("entitlements").select("*", { count: "exact", head: true }).eq("active", true).eq("entitlement_type", "course_app_access").then((r) => r.count ?? 0),
        supabase.from("entitlements").select("*", { count: "exact", head: true }).eq("active", true).gte("updated_at", startCur).then((r) => r.count ?? 0),
        supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("cancel_at_period_end", true).then((r) => r.count ?? 0),
        supabase.from("profiles").select("*", { count: "exact", head: true }).lt("last_seen_at", at14).then((r) => r.count ?? 0),
        countBetween("chat_messages", "created_at", startCur),
        countBetween("chat_messages", "created_at", startPrior, startCur),
        // Bounded fetch for the signups sparkline (timestamps only).
        supabase.from("profiles").select("created_at").gte("created_at", startCur).order("created_at").limit(10000).then((r) => (r.data ?? []) as { created_at: string }[]),
        crisisTrend(range),
      ]);

      // Bucket signups into `range` daily buckets.
      const series = new Array(range).fill(0) as number[];
      const startMs = subDays(now, range).getTime();
      const dayMs = 86_400_000;
      for (const row of signupRows) {
        const idx = Math.floor((new Date(row.created_at).getTime() - startMs) / dayMs);
        if (idx >= 0 && idx < range) series[idx] += 1;
      }

      return {
        signups: { current: signupsCur, prior: signupsPrior, series },
        wau,
        mau,
        activeEntitlements,
        newGrants,
        cancelling,
        atRisk,
        brotherhood: { current: broCur, prior: broPrior },
        standFirm: standTrend ? { total: standTrend.reduce((s, d) => s + Number(d.count), 0), series: standTrend } : null,
      };
    },
  });
}
