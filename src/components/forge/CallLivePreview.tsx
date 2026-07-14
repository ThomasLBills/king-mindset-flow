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
          {/* Live-style preview surface. PREVIEW MODE: embeds Lofi Girl's
              current live channel stream (channel-based URL always resolves to
              whatever is live right now, so it doesn't 404 when a specific
              video ID gets rotated or taken down). Swap for the real stream
              URL when the call goes live. */}
          <div className="relative h-56 w-full overflow-hidden bg-[hsl(0_0%_6%)]">
            <iframe
              title="Brotherhood call preview"
              src="https://www.youtube.com/embed/live_stream?channel=UCSJ4gkVC6NrvII8umztf0Ow&autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1"
              allow="autoplay; encrypted-media"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[240%] w-[140%] -translate-x-1/2 -translate-y-1/2 border-0"
              tabIndex={-1}
            />
            {/* Dark vignette so text/badges stay legible over any frame */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.55) 100%)",
              }}
              aria-hidden="true"
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