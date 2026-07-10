import type { HTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Hatch } from "./scenes";

/** Tiny tracked-caps label, the Forge's structural voice. */
export const Eyebrow = ({
  className,
  tone = "dim",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: "dim" | "gold" }) => (
  <span
    className={cn(
      "font-display text-[11px] font-semibold uppercase tracking-[0.2em]",
      tone === "gold" ? "text-gold" : "text-dim",
      className
    )}
    {...props}
  />
);

/** Raised card surface with optional engraving hatch. */
export const SectionCard = ({
  className,
  hatch = false,
  children,
  ...props
}: HTMLAttributes<HTMLElement> & { hatch?: boolean }) => (
  <section
    className={cn(
      "relative overflow-hidden rounded-lg border border-line bg-raised",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
      className
    )}
    {...props}
  >
    {hatch && <Hatch />}
    <div className="relative">{children}</div>
  </section>
);

/** Short engraved-gold rule. */
export const FoilRule = ({ className }: { className?: string }) => (
  <hr className={cn("foil h-px w-16 border-0", className)} aria-hidden="true" />
);

/** Circle initials avatar. */
export const InitialsAvatar = ({
  initials,
  className,
  tone = "gold",
}: {
  initials: string;
  className?: string;
  tone?: "gold" | "raised";
}) => (
  <span
    aria-hidden="true"
    className={cn(
      "grid shrink-0 place-items-center rounded-full font-display text-xs font-bold",
      tone === "gold" ? "bg-gold text-primary-foreground" : "bg-raised-2 text-bone",
      "h-8 w-8",
      className
    )}
  >
    {initials}
  </span>
);

/** Full-bleed scene banner with a scrim fading into the page background. */
export const SceneBanner = ({
  scene,
  className,
  scrimClassName,
  children,
}: {
  scene: ReactNode;
  className?: string;
  scrimClassName?: string;
  children?: ReactNode;
}) => (
  <div className={cn("relative overflow-hidden", className)}>
    {scene}
    <div
      className={cn(
        "pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-forge",
        scrimClassName
      )}
      aria-hidden="true"
    />
    {children && <div className="relative">{children}</div>}
  </div>
);

/**
 * Deterministic back control for PWA screens that aren't a primary nav
 * destination. Always points at an explicit parent `to` — never navigate(-1),
 * which dead-ends when the app is opened cold from the home-screen icon, a
 * deep link, or a push notification (empty history stack).
 */
export const BackLink = ({
  to,
  label,
  className,
}: {
  to: string;
  label: string;
  className?: string;
}) => (
  <Link
    to={to}
    className={cn(
      "inline-flex items-center gap-1.5 text-sm text-dim transition-colors hover:text-bone",
      className
    )}
  >
    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
    {label}
  </Link>
);
