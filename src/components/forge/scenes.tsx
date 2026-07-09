/**
 * Hand-drawn SVG scene art, cropped and bleeding under scrims. Gradient ids are
 * namespaced with useId so a scene can appear more than once per page.
 */
import { useId } from "react";
import { cn } from "@/lib/utils";

const wrap = "pointer-events-none absolute inset-0 h-full w-full";

/** Film-grain overlay. */
export const Grain = ({ className }: { className?: string }) => {
  const id = useId();
  return (
    <svg className={cn(wrap, "opacity-[0.05] mix-blend-overlay", className)} aria-hidden="true">
      <filter id={`${id}-g`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id}-g)`} />
    </svg>
  );
};

/** Diagonal engraving hatch, texture for card corners. */
export const Hatch = ({ className }: { className?: string }) => {
  const id = useId();
  return (
    <svg className={cn(wrap, "opacity-[0.09]", className)} aria-hidden="true">
      <pattern
        id={`${id}-h`}
        width="18"
        height="18"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <line x1="0" y1="0" x2="0" y2="18" stroke="#8C7132" strokeWidth="1" />
        <line x1="1.4" y1="0" x2="1.4" y2="18" stroke="#E4CD8C" strokeWidth="0.5" />
      </pattern>
      <rect width="100%" height="100%" fill={`url(#${id}-h)`} />
    </svg>
  );
};

/** Light shafts through a dark room - real photo (public/pics/scene-shafts.png). */
export const SceneShafts = ({ className }: { className?: string }) => (
  <img
    src="/pics/scene-shafts.png"
    alt=""
    aria-hidden="true"
    className={cn(wrap, "object-cover", className)}
  />
);

/**
 * Dawn over ridgelines - real photo. `wide` (16:9) for landing/covenant
 * backdrops, `tall` (3:4) for the auth side panel.
 */
export const SceneRidge = ({
  className,
  variant = "wide",
}: {
  className?: string;
  variant?: "wide" | "tall";
}) => (
  <img
    src={variant === "tall" ? "/pics/scene-ridge-tall.png" : "/pics/scene-ridge-wide.png"}
    alt=""
    aria-hidden="true"
    className={cn(wrap, "object-cover", className)}
  />
);

/** A figure standing in light - real photo (public/pics/scene-figure.png). */
export const SceneFigure = ({ className }: { className?: string }) => (
  <img
    src="/pics/scene-figure.png"
    alt=""
    aria-hidden="true"
    className={cn(wrap, "object-cover", className)}
  />
);
