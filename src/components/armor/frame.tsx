/**
 * Shared chrome + primitives for the Armor page ("Your Armor"). The page
 * renders ONE ArmorFrame (crisis backdrop + leave-to-Today X + monogram) and
 * swaps the inner tool. Tools render only their inner content plus a BackTo.
 */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { LkMonogram } from "@/components/forge/brand";
import { Grain, SceneFigure } from "@/components/forge/scenes";

export const ArmorFrame = ({ children }: { children: ReactNode }) => (
  <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-forge px-6 py-12 text-center">
    <SceneFigure className="opacity-80" />
    {/* Vignette tracks the (lifted) --background token instead of a hardcoded
        near-black, and its alphas are softened, so the crisis screen lightens
        with the rest of the app and the option rows stay legible. */}
    <div
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_42%,hsl(var(--background)/0.3),hsl(var(--background)/0.82))]"
      aria-hidden="true"
    />
    <Grain />
    <Link
      to="/app"
      aria-label="Leave, back to Today"
      className="absolute right-5 top-5 z-10 rounded-full border border-line bg-raised/60 p-2 text-dim transition-colors hover:text-bone"
    >
      <X className="h-4 w-4" aria-hidden="true" />
    </Link>
    <div className="relative z-10 flex w-full max-w-[420px] flex-col items-center">
      <LkMonogram className="mb-4 h-6 w-8 opacity-90" />
      {children}
    </div>
  </div>
);

export const ActionRow = ({
  icon: Icon,
  title,
  sub,
  primary = false,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  sub: string;
  primary?: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex w-full items-center gap-3.5 rounded-lg border p-4 text-left transition-colors",
      primary
        ? "border-gold-deep bg-gradient-to-b from-[hsl(24_41%_12%)] to-[hsl(26_45%_9%)]"
        : "border-line bg-raised-2 hover:border-gold-deep hover:brightness-110"
    )}
  >
    <Icon className="h-[22px] w-[22px] shrink-0 text-gold" aria-hidden="true" />
    <span>
      <b className={cn("block text-[15px] font-semibold", primary ? "text-gold-bright" : "text-bone")}>
        {title}
      </b>
      <span className="text-xs text-bone-2">{sub}</span>
    </span>
  </button>
);

export const BackTo = ({ onClick, label = "Back" }: { onClick: () => void; label?: string }) => (
  <button
    onClick={onClick}
    className="mx-auto mt-6 flex items-center gap-1.5 text-sm text-dim transition-colors hover:text-bone-2"
  >
    <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {label}
  </button>
);

/** Slow expand/settle breathing ring. Static under reduced motion. */
export const BreathingPacer = () => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      animate={reduce ? undefined : { scale: [0.86, 1.12, 1.12, 0.86] }}
      transition={
        reduce
          ? undefined
          : { duration: 11, times: [0, 0.45, 0.55, 1], repeat: Infinity, ease: "easeInOut" }
      }
      className="relative my-3 grid h-32 w-32 place-items-center rounded-full border-[1.5px] border-gold-deep"
    >
      <div
        className="absolute inset-3.5 rounded-full border border-line bg-[radial-gradient(circle,hsl(38_45%_10%),hsl(35_30%_6%))]"
        aria-hidden="true"
      />
      <span className="relative font-display text-xs uppercase tracking-[0.16em] text-gold-bright">
        Breathe
      </span>
    </motion.div>
  );
};
