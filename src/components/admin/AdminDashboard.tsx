import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Eyebrow, SectionCard } from "@/components/forge/atoms";
import { useAdminEngagementStats } from "@/hooks/useAdminEngagement";
import { useAdminKpis, type RangeDays } from "@/hooks/useAdminKpis";

const RANGES: RangeDays[] = [7, 30, 90];

/** Minimal inline sparkline; single line, colorblind-safe, theme via currentColor. */
function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const w = 100;
  const h = 28;
  const max = Math.max(...data, 1);
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 2) - 1}`)
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="h-7 w-full text-gold"
      role="img"
      aria-label={`Trend over the period, ${data.reduce((a, b) => a + b, 0)} total`}
    >
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Delta({ current, prior, upGood = true }: { current: number; prior: number; upGood?: boolean }) {
  if (prior === 0 && current === 0) return <span className="text-xs text-dim">no change</span>;
  const pct = prior === 0 ? 100 : Math.round(((current - prior) / prior) * 100);
  const up = current >= prior;
  const good = up === upGood;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium tabular-nums", good ? "text-gold-bright" : "text-ember")}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {up ? "+" : ""}
      {pct}%<span className="sr-only"> versus the previous {"period"}</span>
    </span>
  );
}

function KpiCard({
  label,
  value,
  delta,
  sublabel,
  sparkline,
  loading,
}: {
  label: string;
  value: ReactNode;
  delta?: ReactNode;
  sublabel?: ReactNode;
  sparkline?: ReactNode;
  loading?: boolean;
}) {
  return (
    <SectionCard className="flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">{label}</p>
        {!loading && delta}
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-16" />
      ) : (
        <p className="mt-1 font-display text-3xl font-bold tabular-nums text-bone">{value}</p>
      )}
      {sublabel && !loading && <p className="mt-0.5 text-xs text-dim">{sublabel}</p>}
      {sparkline && !loading && <div className="mt-auto pt-3">{sparkline}</div>}
    </SectionCard>
  );
}

const AdminDashboard = () => {
  const [range, setRange] = useState<RangeDays>(30);
  const { data: k, isLoading } = useAdminKpis(range);
  const { data: eng, isLoading: engLoading } = useAdminEngagementStats();
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow className="mb-1 block">Overview</Eyebrow>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-dim">Community health at a glance. Aggregate only, never a per-user scoreboard.</p>
        </div>
        <div role="group" aria-label="Time range" className="inline-flex shrink-0 rounded-md border border-line bg-forge-2 p-0.5">
          {RANGES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setRange(d)}
              aria-pressed={range === d}
              className={cn(
                "min-h-[32px] rounded px-3 text-sm font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                range === d ? "bg-raised-2 text-gold" : "text-dim hover:text-bone"
              )}
            >
              {d}d
            </button>
          ))}
        </div>
      </header>

      {/* Acquisition + engagement */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="New signups"
          loading={isLoading}
          value={k?.signups.current ?? 0}
          delta={k && <Delta current={k.signups.current} prior={k.signups.prior} />}
          sublabel={`last ${range} days`}
          sparkline={k && <Sparkline data={k.signups.series} />}
        />
        <KpiCard
          label="Active members"
          loading={isLoading}
          value={k?.wau ?? 0}
          sublabel={k ? `7-day active · ${k.mau} in 30d` : undefined}
        />
        <KpiCard
          label="Brotherhood"
          loading={isLoading}
          value={k?.brotherhood.current ?? 0}
          delta={k && <Delta current={k.brotherhood.current} prior={k.brotherhood.prior} />}
          sublabel={`messages, last ${range} days`}
        />
        <KpiCard
          label="Curriculum completion"
          loading={engLoading}
          value={eng ? `${eng.completionRate}%` : "0%"}
          sublabel={eng ? `${eng.lessonsCompleted} lessons completed` : undefined}
        />
      </div>

      {/* Access + health */}
      <div>
        <Eyebrow className="mb-3 block">Access &amp; health</Eyebrow>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            label="Active access"
            loading={isLoading}
            value={k?.activeEntitlements ?? 0}
            sublabel={k ? `${k.newGrants} new in range` : undefined}
          />
          <KpiCard
            label="Cancelling"
            loading={isLoading}
            value={k?.cancelling ?? 0}
            sublabel="subscriptions ending"
          />
          <KpiCard
            label="At risk"
            loading={isLoading}
            value={k?.atRisk ?? 0}
            sublabel="no activity in 14+ days"
          />
          {k?.standFirm ? (
            <KpiCard
              label="Stand Firm"
              loading={isLoading}
              value={k.standFirm.total}
              sublabel={`taps, last ${range} days`}
              sparkline={<Sparkline data={k.standFirm.series.map((d) => Number(d.count))} />}
            />
          ) : (
            <SectionCard className="flex flex-col justify-center p-4">
              <p className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">Stand Firm</p>
              <p className="mt-1 text-sm text-bone-2">Unavailable</p>
              <p className="mt-0.5 text-xs text-dim">Enable the aggregate trend RPC (ADMIN_RUNBOOK.md section 2).</p>
            </SectionCard>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <SectionCard className="p-6">
        <h2 className="mb-4 font-display text-lg font-bold tracking-tight text-bone">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Manage Curriculum",
              sub: "Weeks & lessons",
              icon: BookOpen,
              to: "/admin/curriculum",
              primary: true,
            },
            {
              label: "New Announcement",
              sub: "Broadcast to kings",
              icon: Plus,
              to: "/admin/announcements",
            },
            {
              label: "View Users",
              sub: "Roster & activity",
              icon: Users,
              to: "/admin/users",
            },
            {
              label: "Entitlements",
              sub: "Access & trials",
              icon: ShieldCheck,
              to: "/admin/entitlements",
            },
          ].map(({ label, sub, icon: Icon, to, primary }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className={
                primary
                  ? "group flex items-center gap-3 rounded-lg border border-gold-deep bg-gradient-to-b from-[hsl(24_41%_12%)] to-[hsl(26_45%_9%)] p-4 text-left transition-[filter] hover:brightness-110"
                  : "group flex items-center gap-3 rounded-lg border border-line bg-raised-2 p-4 text-left transition-colors hover:border-gold-deep"
              }
            >
              <span
                className={
                  primary
                    ? "grid h-10 w-10 shrink-0 place-items-center rounded-md bg-gold/15 text-gold-bright"
                    : "grid h-10 w-10 shrink-0 place-items-center rounded-md bg-raised text-gold"
                }
              >
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span
                  className={
                    primary
                      ? "block text-sm font-semibold text-gold-bright"
                      : "block text-sm font-semibold text-bone"
                  }
                >
                  {label}
                </span>
                <span className="mt-0.5 block truncate text-xs text-dim">{sub}</span>
              </span>
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

export default AdminDashboard;
