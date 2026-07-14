import { useEffect, useState } from "react";
import { SectionCard, Eyebrow } from "./atoms";
import { WEEKLY_CALL } from "@/data/weeklyCall";
import { cn } from "@/lib/utils";

/**
 * Twitch-style "live now" preview for the weekly brotherhood call.
 * We can't stream the actual external call into the app, so this is an
 * ambient, visually alive preview: pulsing LIVE badge, animated ember
 * backdrop, and the whole card jumps to the real call when tapped.
 */
export const CallLivePreview = () => {
  const [tick, setTick] = useState(0);

  // Gentle heartbeat so the "waveform" bars stay in motion.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 700);
    return () => clearInterval(id);
  }, []);

  const open = () =>
    window.open(WEEKLY_CALL.joinUrl, "_blank", "noopener,noreferrer");

  return (
    <div>
      <Eyebrow className="mb-3 block text-center">Live now</Eyebrow>
      <SectionCard className="p-0">
        <button
          type="button"
          onClick={open}
          aria-label="Join the live brotherhood call"
          className="group relative block w-full text-left"
        >
          {/* Ambient preview surface (stand-in for a live video tile) */}
          <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-[hsl(35_23%_10%)] via-[hsl(0_0%_10%)] to-[hsl(35_30%_6%)]">
            {/* Soft moving glow */}
            <div
              className="pointer-events-none absolute -inset-8 opacity-60 blur-2xl"
              style={{
                background:
                  "radial-gradient(40% 60% at 30% 40%, rgba(184,150,63,0.35), transparent 70%), radial-gradient(35% 50% at 75% 65%, rgba(184,150,63,0.18), transparent 70%)",
                transform: `translate3d(${(tick % 6) - 3}px, ${
                  ((tick + 2) % 6) - 3
                }px, 0)`,
                transition: "transform 700ms ease-in-out",
              }}
            />

            {/* LIVE badge */}
            <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-md bg-black/70 px-2 py-1 backdrop-blur-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
              </span>
              <span className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-bone">
                Live
              </span>
            </div>

            {/* Viewer hint, top right (Twitch-style) */}
            <div className="absolute right-3 top-3 z-10 rounded-md bg-black/60 px-2 py-1 font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-bone/80 backdrop-blur-sm">
              Tap to join
            </div>

            {/* Waveform bars, bottom center */}
            <div className="absolute inset-x-0 bottom-3 z-10 flex items-end justify-center gap-1">
              {Array.from({ length: 9 }).map((_, i) => {
                const seed = (tick + i * 3) % 7;
                const h = 6 + seed * 3;
                return (
                  <span
                    key={i}
                    className={cn(
                      "w-[3px] rounded-sm bg-gold/70",
                      "transition-[height] duration-500 ease-out"
                    )}
                    style={{ height: `${h}px` }}
                  />
                );
              })}
            </div>

            {/* Faint scanline for the "broadcast" feel */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0 1px, transparent 1px 3px)",
              }}
              aria-hidden="true"
            />
          </div>

          {/* Caption row */}
          <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
            <div>
              <p className="font-display text-sm font-bold tracking-tight text-bone">
                Brotherhood call is live
              </p>
              <p className="mt-0.5 text-[11px] text-gold">
                {WEEKLY_CALL.label} · all brothers welcome
              </p>
            </div>
            <span className="shrink-0 rounded-md border border-gold/40 px-3 py-1.5 font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-gold transition-colors group-hover:bg-gold/10">
              Join
            </span>
          </div>
        </button>
      </SectionCard>
    </div>
  );
};

export default CallLivePreview;