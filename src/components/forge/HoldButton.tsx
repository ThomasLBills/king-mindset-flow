/**
 * Press-and-hold commit button — the original app's tactile ritual for
 * effortful actions (redirecting an urge, declaring truth, returning after
 * a fall). The hold is deliberate friction: an embodied choice, not a tap.
 *
 * Pointer users must hold for `duration` ms (a gold fill shows progress).
 * Keyboard and assistive-tech users activate normally with Enter/Space —
 * the ritual is a pointer gesture, never an accessibility gate.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const TICK_MS = 40;

interface HoldButtonProps {
  onComplete: () => void;
  children: ReactNode;
  duration?: number;
  disabled?: boolean;
  className?: string;
}

export const HoldButton = ({
  onComplete,
  children,
  duration = 1200,
  disabled = false,
  className,
}: HoldButtonProps) => {
  const [progress, setProgress] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const done = useRef(false);

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    if (!done.current) setProgress(0);
  }, []);

  useEffect(() => stop, [stop]);

  const start = () => {
    if (disabled || done.current || timer.current) return;
    const startedAt = Date.now();
    timer.current = setInterval(() => {
      const p = Math.min(1, (Date.now() - startedAt) / duration);
      setProgress(p);
      if (p >= 1) {
        done.current = true;
        stop();
        onComplete();
        // allow re-use after completion (e.g. dialog stays open)
        setTimeout(() => {
          done.current = false;
          setProgress(0);
        }, 400);
      }
    }, TICK_MS);
  };

  const keyActivate = (e: React.KeyboardEvent) => {
    if (disabled || e.repeat) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onComplete();
    }
  };

  return (
    <button
      type="button"
      disabled={disabled}
      title="Press and hold"
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={keyActivate}
      className={cn(
        "relative inline-flex h-12 w-full select-none items-center justify-center overflow-hidden rounded-md",
        "bg-primary px-8 text-base font-semibold text-primary-foreground",
        "transition-[filter] hover:brightness-110",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright focus-visible:ring-offset-2 ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      style={{ touchAction: "none" }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 bg-black/25 transition-none"
        style={{ width: `${progress * 100}%` }}
      />
      <span className="relative">{children}</span>
    </button>
  );
};
