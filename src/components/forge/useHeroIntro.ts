/**
 * Hero entrance (sohub-style), landing-only. The GSAP timeline is built + set to
 * its hidden "from" state on mount, held PAUSED until `play` flips true — so it
 * fires when the loader splash finishes, not behind it. Sequence: eagle fades
 * in, wordmark letters pop left→right (scale + fade, back overshoot), tagline
 * mask-reveals up, CTA row + scroll cue rise in last. Skipped under
 * reduced-motion (everything renders at its resting state).
 *
 * Targets are scoped to the hero <section> by class:
 *   .hero-render (eagle wrapper)  .hero-word (<h1>)  .hero-tagline (<p>)
 *   .hero-cta (button row)        .hero-scroll (scroll label)
 */
import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

// Set at module eval — before the browser restores scroll on refresh — so a
// reload always starts at the hero (not a restored position). Doing this in an
// effect was too late: the restore had already happened.
if (typeof history !== "undefined" && "scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

export function useHeroIntro(scopeRef: RefObject<HTMLElement>, play: boolean) {
  const tl = useRef<gsap.core.Timeline | null>(null);

  useLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    window.scrollTo(0, 0);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const word = SplitText.create(".hero-word", { type: "chars" });
      const tag = SplitText.create(".hero-tagline", { type: "lines", mask: "lines" });

      // Opacity-only on the eagle so we don't fight its -translate-x-1/2 / float.
      gsap.set(".hero-render", { opacity: 0 });
      gsap.set(word.chars, { opacity: 0, scale: 0.9, transformOrigin: "0% 100%" });
      gsap.set(tag.lines, { yPercent: 110 });
      gsap.set([".hero-cta", ".hero-scroll"], { opacity: 0, y: 18 });

      tl.current = gsap
        .timeline({ paused: true, defaults: { ease: "back.out(1.7)" } })
        .to(".hero-render", { opacity: 1, duration: 0.8, ease: "power2.out" }, 0)
        .to(word.chars, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.055 }, 0.2)
        .to(tag.lines, { yPercent: 0, duration: 0.6, ease: "power3.out", stagger: 0.1 }, "-=0.3")
        .to([".hero-cta", ".hero-scroll"], { opacity: 1, y: 0, duration: 0.5, stagger: 0.12 }, "-=0.3");
    }, scope);

    return () => {
      ctx.revert();
      tl.current = null;
    };
  }, [scopeRef]);

  // Fire the entrance a beat after the loader signals it's done.
  useEffect(() => {
    if (!play) return;
    const t = setTimeout(() => tl.current?.play(), 180);
    return () => clearTimeout(t);
  }, [play]);
}
