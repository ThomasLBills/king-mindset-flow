/**
 * Press-and-hold commit button - the original app's tactile ritual for
 * effortful actions (redirecting an urge, declaring truth, returning after
 * a fall). The hold is deliberate friction: an embodied choice, not a tap.
 *
 * Pointer users must hold for `duration` ms (a gold fill shows progress).
 * Keyboard and assistive-tech users activate normally with Enter/Space -
 * the ritual is a pointer gesture, never an accessibility gate.
 *
 * Smoothness: the fill is a single GPU-composited `transform: scaleX`
 * transition, so the browser interpolates it off the main thread (no
 * per-tick React state / re-renders). Completion is gated by one
 * `setTimeout(duration)` rather than the CSS transition finishing, so the
 * hold contract (full hold fires once, early release never fires) stays
 * correct even where motion/transitions are reduced or disabled.
 */
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

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
  const [pressed, setPressed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const done = useRef(false);
  const descriptionId = useId();

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  // Cancel an in-progress hold (early release / pointer leave / unmount).
  const stop = useCallback(() => {
    clearTimer();
    setPressed(false);
  }, [clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  const start = () => {
    if (disabled || done.current || timer.current) return;
    setPressed(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      done.current = true;
      setPressed(false);
      onComplete();
      // Allow re-use after completion (dialog / screen may stay mounted).
      setTimeout(() => {
        done.current = false;
      }, 400);
    }, duration);
  };

  const keyActivate = (e: React.KeyboardEvent) => {
    if (disabled || e.repeat) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onComplete();
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        title="Press and hold"
        aria-describedby={descriptionId}
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
          className="absolute inset-y-0 left-0 w-full origin-left bg-black/25 will-change-transform"
          style={{
            transform: pressed ? "scaleX(1)" : "scaleX(0)",
            transitionProperty: "transform",
            transitionTimingFunction: "linear",
            transitionDuration: pressed ? `${duration}ms` : "0ms",
          }}
        />
        <span className="relative">{children}</span>
      </button>
      <span id={descriptionId} className="sr-only">
        With a pointer, press and hold until the button fills. With a keyboard, press Enter or
        Space to activate immediately.
      </span>
    </>
  );
};
