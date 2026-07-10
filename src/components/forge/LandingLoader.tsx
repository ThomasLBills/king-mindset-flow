/**
 * Landing-only splash (sohub-style). Fixed dark overlay with the LK logo that
 * eases in (back overshoot), zooms hard into frame (power4.in), then hard-cuts
 * to reveal the page. Scoped to the landing by being rendered only in Landing.tsx.
 * The member app (/app) keeps its own route loader. Skipped under
 * reduced-motion. Kept snappy on purpose (the real app needs a fast loader).
 */
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Cold-load only: the splash should play on a real page load, not every time
// an SPA navigation remounts Landing (returning to "/"). A module-level flag
// resets on hard refresh (which is exactly a cold load) so that plays again.
let ranThisLoad = false;

export const LandingLoader = ({ onDone }: { onDone?: () => void }) => {
  const [done, setDone] = useState(ranThisLoad);
  const overlay = useRef<HTMLDivElement>(null);
  const logo = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // Already played this page load (SPA nav back to "/"): skip the splash but
    // still signal done so the page reveals.
    if (ranThisLoad) {
      onDone?.();
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      ranThisLoad = true;
      setDone(true);
      onDone?.();
      return;
    }
    const ov = overlay.current;
    const box = logo.current;
    const mark = box?.firstElementChild;
    if (!ov || !box || !mark) return;

    // "from" state, set pre-paint so there's no flash of the resting logo.
    gsap.set(mark, { opacity: 0, scale: 0.75, rotation: -120 });

    const tl = gsap.timeline({
      paused: true,
      onComplete: () => {
        ranThisLoad = true; // don't replay on later SPA remounts of Landing
        onDone?.(); // zoom + cut done → page fades in
        setDone(true);
      },
    });
    tl.to(mark, { opacity: 1, scale: 1, rotation: 0, duration: 0.8, ease: "back.out(1.6)" })
      .to(mark, { scale: 22, duration: 0.5, ease: "power4.in" }, "+=0.08")
      .to(box, { width: "320vw", duration: 0.5, ease: "power4.in" }, "<")
      .set(ov, { autoAlpha: 0 }); // hard cut, the zoom disguises the swap

    // Play once fonts are ready (so the revealed wordmark is correct), capped so
    // it never stalls on a slow connection.
    let cancelled = false;
    Promise.race([document.fonts.ready, wait(500)]).then(() => {
      if (!cancelled) tl.play();
    });

    return () => {
      cancelled = true;
      tl.kill();
    };
  }, []);

  if (done) return null;

  return (
    <div
      ref={overlay}
      data-landing-loader
      className="pointer-events-none fixed inset-0 z-[999] flex items-center justify-center overflow-hidden bg-forge"
    >
      <div ref={logo} className="w-20 lg:w-36">
        {/* LK mark filled with the exact landing bg colour (bg-bone token) via a
            mask, so the splash logo matches the page 1:1, not a filter approx. */}
        <div
          className="aspect-square w-full bg-bone"
          style={{
            WebkitMaskImage: "url(/lk-icon.png)",
            maskImage: "url(/lk-icon.png)",
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
          }}
        />
      </div>
    </div>
  );
};
