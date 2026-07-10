/**
 * Hand-drawn SVG scene art, cropped and bleeding under scrims. Gradient ids are
 * namespaced with useId so a scene can appear more than once per page.
 */
import { useId, type ReactNode } from "react";
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

/** Light shafts through a dark room - real photo (public/pics/scene-shafts.webp). */
export const SceneShafts = ({ className }: { className?: string }) => (
  <img
    src="/pics/scene-shafts.webp"
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
    src={variant === "tall" ? "/pics/scene-ridge-tall.webp" : "/pics/scene-ridge-wide.webp"}
    alt=""
    aria-hidden="true"
    className={cn(wrap, "object-cover", className)}
  />
);

/** A figure standing in light - real photo (public/pics/scene-figure.webp). */
export const SceneFigure = ({ className }: { className?: string }) => (
  <img
    src="/pics/scene-figure.webp"
    alt=""
    aria-hidden="true"
    className={cn(wrap, "object-cover", className)}
  />
);

/**
 * The shared Today-style page backdrop: warm ember wash + film grain + the
 * light-shafts photo bleeding from the top under a fade mask. Used across
 * Today, Brotherhood, Grow, and Profile so every screen shares one atmosphere.
 */
const BackdropLayers = () => (
  <>
    <div className="ember-bg pointer-events-none absolute inset-0" aria-hidden="true" />
    <Grain />
    <SceneShafts className="h-[440px] opacity-90 [mask-image:linear-gradient(to_bottom,black_25%,transparent_100%)] lg:h-[500px]" />
    {/*
      Darkening scrim over the light-shafts photo so bone/gold text stays
      readable on EVERY screen that uses this backdrop (Today, Brotherhood,
      Grow, Profile, Admin). Fades to transparent so content below keeps the
      warm ember wash untouched.
    */}
    <div
      className="pointer-events-none absolute inset-x-0 top-0 h-[560px] lg:h-[620px]"
      style={{
        background:
          "linear-gradient(to bottom, hsl(var(--background) / 0.88) 0%, hsl(var(--background) / 0.6) 42%, hsl(var(--background) / 0) 100%)",
      }}
      aria-hidden="true"
    />
  </>
);

/**
 * Drop-in page background. With no children it renders just the layers (place
 * it as the first child of your own `relative` wrapper, e.g. Today). With
 * children it provides the `relative` wrapper and lifts the content above the
 * layers via `className` (the page's centered column classes).
 */
export const PageBackdrop = ({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) =>
  children === undefined ? (
    <BackdropLayers />
  ) : (
    <div className="relative">
      <BackdropLayers />
      <div className={cn("relative", className)}>{children}</div>
    </div>
  );
