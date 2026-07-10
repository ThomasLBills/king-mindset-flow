/**
 * Shared celebration burst for completion moments (path lessons, armor
 * redirects/returns/declarations). Thin wrapper over canvas-confetti in the
 * forge gold/bone palette. No-ops under prefers-reduced-motion so it never
 * fights accessibility. Import this; do NOT call canvas-confetti directly, so
 * the palette and reduced-motion guard stay in one place.
 */
import confetti from "canvas-confetti";

const GOLD_BONE = ["#C9A24B", "#E8CE8A", "#B8963F", "#F5F3EE"];

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** A single celebratory burst rising from just below center. */
export const celebrate = (opts?: confetti.Options) => {
  if (typeof window === "undefined" || prefersReducedMotion()) return;
  confetti({
    particleCount: 90,
    spread: 72,
    startVelocity: 42,
    ticks: 200,
    origin: { y: 0.72 },
    colors: GOLD_BONE,
    disableForReducedMotion: true,
    ...opts,
  });
};

/**
 * A bigger, two-sided "victory" burst for the heaviest milestones (finishing a
 * lesson, completing the return). Fires two angled cannons.
 */
export const celebrateBig = () => {
  if (typeof window === "undefined" || prefersReducedMotion()) return;
  const base: confetti.Options = {
    particleCount: 70,
    spread: 60,
    startVelocity: 48,
    ticks: 220,
    colors: GOLD_BONE,
    disableForReducedMotion: true,
  };
  confetti({ ...base, angle: 60, origin: { x: 0, y: 0.7 } });
  confetti({ ...base, angle: 120, origin: { x: 1, y: 0.7 } });
};
