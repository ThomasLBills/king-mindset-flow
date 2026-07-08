/**
 * Hand-drawn SVG scene art, cropped and bleeding under scrims. Gradient ids are
 * namespaced with useId so a scene can appear more than once per page.
 */
import { useId } from "react";
import { cn } from "@/lib/utils";

const wrap = "pointer-events-none absolute inset-0 h-full w-full";

/**
 * Visible marker on stand-in artwork. Each drawn scene below is a placeholder
 * for a real photograph; the tag says what photo belongs there. Delete the
 * tag (or the whole scene component) when the real image goes in.
 */
const PlaceholderTag = ({ description }: { description: string }) => (
  <span className="pointer-events-none absolute bottom-2 right-2 z-10 rounded-sm border border-dashed border-ember/70 bg-forge/85 px-1.5 py-0.5 font-display text-[9px] font-semibold uppercase tracking-[0.08em] text-ember">
    Placeholder image: {description}
  </span>
);

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

/** Light shafts through a dark room — real photo (public/pics/scene-shafts.png). */
export const SceneShafts = ({ className }: { className?: string }) => (
  <img
    src="/pics/scene-shafts.png"
    alt=""
    aria-hidden="true"
    className={cn(wrap, "object-cover", className)}
  />
);

/**
 * Dawn over ridgelines — real photo. `wide` (16:9) for landing/covenant
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

/** A figure standing in light. Placeholder for the Stand Firm backdrop photo. */
export const SceneFigure = ({ className }: { className?: string }) => {
  const id = useId();
  const p = (s: string) => `${id}-${s}`;
  return (
    <>
    <PlaceholderTag description="man standing in a beam of light, seen from behind" />
    <svg
      viewBox="0 0 900 1600"
      preserveAspectRatio="xMidYMid slice"
      className={cn(wrap, className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={p("bg")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#14110D" />
          <stop offset="0.55" stopColor="#191510" />
          <stop offset="1" stopColor="#14110D" />
        </linearGradient>
        <linearGradient id={p("beam")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#C9A961" stopOpacity="0" />
          <stop offset="0.5" stopColor="#E4CD8C" stopOpacity="0.28" />
          <stop offset="1" stopColor="#C9A961" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={p("glow")} cx="0.5" cy="0.42" r="0.55">
          <stop offset="0" stopColor="#E4CD8C" stopOpacity="0.72" />
          <stop offset="0.3" stopColor="#C9A961" stopOpacity="0.35" />
          <stop offset="0.65" stopColor="#8C7132" stopOpacity="0.1" />
          <stop offset="1" stopColor="#8C7132" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={p("rim")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E4CD8C" />
          <stop offset="0.12" stopColor="#C9A961" />
          <stop offset="0.32" stopColor="#8C7132" />
          <stop offset="0.55" stopColor="#8C7132" stopOpacity="0.3" />
          <stop offset="0.72" stopColor="#8C7132" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={p("vig")} cx="0.5" cy="0.44" r="0.78">
          <stop offset="0.5" stopColor="#14110D" stopOpacity="0" />
          <stop offset="1" stopColor="#14110D" stopOpacity="0.88" />
        </radialGradient>
        <g id={p("fig")}>
          <path d="M 235 1600 L 212 990 C 206 852 262 792 360 772 Q 405 762 450 760 Q 495 762 540 772 C 638 792 694 852 688 990 L 665 1600 Z" />
          <rect x="410" y="640" width="80" height="150" rx="12" />
          <ellipse cx="450" cy="588" rx="76" ry="94" />
        </g>
      </defs>
      <rect width="900" height="1600" fill={`url(#${p("bg")})`} />
      <rect x="290" y="0" width="320" height="1600" fill={`url(#${p("beam")})`} />
      <rect width="900" height="1600" fill={`url(#${p("glow")})`} />
      <ellipse cx="450" cy="1500" rx="300" ry="70" fill="#8C7132" opacity="0.15" />
      <use
        href={`#${p("fig")}`}
        fill={`url(#${p("rim")})`}
        transform="translate(0 -10) translate(450 590) scale(1.05) translate(-450 -590)"
      />
      <use href={`#${p("fig")}`} fill="#14110D" />
      <rect width="900" height="1600" fill={`url(#${p("vig")})`} />
    </svg>
    </>
  );
};
