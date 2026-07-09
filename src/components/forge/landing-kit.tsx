/**
 * Behaviour bits for the sohub-inspired landing page. Kept out of Landing.tsx
 * so the page reads as layout. Everything here is scoped to the landing:
 * useLenis tears itself down on unmount, so the member app keeps native scroll.
 */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { prefetchRoute } from "@/lib/prefetch";

gsap.registerPlugin(ScrollTrigger, SplitText);

/** Buttery smooth-scroll while the landing is mounted. Adds `html.lenis`
 *  (which drives the 8px scrollbar in index.css) and destroys on unmount.
 *  No-op under reduced-motion. */
export const useLenis = () => {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.1 });
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);
};

/** An absolutely-positioned cutout that rises in on load, then idles with a
 *  slow bob. Position/size via `className`; `delay` staggers the entrance. */
export const FloatingSubject = ({
  src,
  alt = "",
  className,
  delay = "0ms",
}: {
  src: string;
  alt?: string;
  className?: string;
  delay?: string;
}) => (
  <div className={cn("pointer-events-none absolute select-none", className)} aria-hidden={alt === "" || undefined}>
    <div className="lk-rise" style={{ animationDelay: delay }}>
      <img src={src} alt={alt} draggable={false} className="lk-float subject-grade h-auto w-full" />
    </div>
  </div>
);

/** sohub's exact reveal: SplitText splits the heading into lines, each fades
 *  (opacity 0->1) and slides up (y 4rem->0), scrubbed by scroll and staggered
 *  per line. Continuous, reverses on scroll-up. Skipped under reduced-motion
 *  (text just renders). autoSplit re-splits on resize. */
export const LinesReveal = ({ children, className }: { children: ReactNode; className?: string }) => {
  const ref = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      SplitText.create(el, {
        type: "lines",
        linesClass: "split-lines",
        autoSplit: true,
        onSplit: (self) => {
          gsap.set(self.lines, { y: "4rem", opacity: 0 });
          return gsap.fromTo(
            self.lines,
            { y: "4rem", opacity: 0 },
            {
              y: 0,
              opacity: 1,
              stagger: 0.1,
              scrollTrigger: { trigger: el, start: "-10% bottom", end: "60% center", scrub: 1 },
            }
          );
        },
      });
    }, ref);
    return () => ctx.revert();
  }, []);
  return (
    <h2 ref={ref} className={className}>
      {children}
    </h2>
  );
};

/** An absolutely-positioned cutout that drifts with scroll (parallax, scrubbed).
 *  Layered: outer = parallax transform, middle = static tilt, inner = idle float. */
export const ParallaxSubject = ({
  src,
  className,
  rotate = 0,
  distance = 120,
}: {
  src: string;
  className?: string;
  rotate?: number;
  distance?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  return (
    <motion.div
      ref={ref}
      aria-hidden="true"
      className={cn("pointer-events-none absolute select-none", className)}
      style={{ y }}
    >
      <div style={{ transform: `rotate(${rotate}deg)` }}>
        <img src={src} alt="" draggable={false} className="lk-float subject-grade w-full" />
      </div>
    </motion.div>
  );
};

/** Fades + drifts up as it enters view and reverses when it leaves (once:false),
 *  the sohub scroll-in/out feel. Reliable with Lenis (IntersectionObserver-based). */
export const RevealInOut = ({
  children,
  className,
  y = 40,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: false, amount: 0.2 }}
    transition={{ duration: 0.7, ease: [0.22, 0.68, 0, 1] }}
  >
    {children}
  </motion.div>
);

/** sohub's 8-path sparkle glyph (verbatim). Spins forever via the `.lk-spin`
 *  CSS class — no JS timeline needed. Decorative. */
const SPARK_PATHS = [
  "M19.6094 43.9991V22.582",
  "M4.75391 35.8655L19.8966 20.7207",
  "M0 19.6074H21.4171",
  "M8.13672 4.75195L23.2815 19.8946",
  "M24.3906 0V21.4171",
  "M39.2481 8.13477L24.1055 23.2795",
  "M43.9991 24.3926H22.582",
  "M35.8635 39.2481L20.7188 24.1055",
];
const SparkIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 44 44" fill="none" stroke="currentColor" className={className} aria-hidden="true">
    {SPARK_PATHS.map((d) => (
      <path key={d} d={d} strokeWidth="2" />
    ))}
  </svg>
);

/** A "magnetic" pill: translates toward the cursor by 20% of its offset from
 *  center (0.2s), springs back on leave (0.7s) — sohub's MagneticWrapper.
 *  Inert under reduced-motion. */
export const MagneticPill = ({ children, className }: { children: ReactNode; className?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let w = 0;
    let h = 0;
    const enter = () => {
      w = el.offsetWidth;
      h = el.offsetHeight;
    };
    const move = (e: MouseEvent) =>
      gsap.to(el, { x: (e.offsetX - w / 2) * 0.2, y: (e.offsetY - h / 2) * 0.2, duration: 0.2 });
    const leave = () => gsap.to(el, { x: 0, y: 0, duration: 0.7 });
    el.addEventListener("mouseenter", enter);
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", leave);
    return () => {
      el.removeEventListener("mouseenter", enter);
      el.removeEventListener("mousemove", move);
      el.removeEventListener("mouseleave", leave);
    };
  }, []);
  return (
    <span ref={ref} className={className}>
      {children}
    </span>
  );
};

export type Pillar = {
  titleTop: string;
  /** Main word. A "\n" splits it across lines (e.g. "Brother\nHood"). */
  titleBottom: string;
  img: string;
  /** Enlarge + shift the subject (everything except the bible). */
  bigImg?: boolean;
  /** Full override of the subject's size/position classes (beats bigImg). */
  imgClass?: string;
  tags: { label: string; icon: LucideIcon }[];
  body: string;
};

// Dark forge cards, stepping lighter card-to-card (sohub's tonal ladder).
// Pills sit one step lighter than their card.
const CARD_BG = ["bg-forge", "bg-forge-2", "bg-raised"];
const PILL_BG = ["bg-raised", "bg-raised-2", "bg-line-soft"];

/** sohub's pinned deck-of-cards, scaled to N cards. Desktop (lg, motion on):
 *  the wrapper pins, each card slides up from below and the ones already shown
 *  get pushed up + scaled down as the next arrives. Mobile / reduced-motion:
 *  a plain stacked list, each card doing a small rise-in. */
export const PillarDeck = ({ pillars }: { pillars: Pillar[] }) => {
  const wrap = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const mm = gsap.matchMedia();

    mm.add("(min-width: 1024px)", () => {
      el.classList.add("is-pinned");
      const cards = gsap.utils.toArray<HTMLElement>(".pillar-card", el);

      // Every card but the first starts fully below the stack.
      gsap.set(cards.slice(1), { yPercent: 120 });
      // First card scales in just before the pin engages.
      gsap.fromTo(
        cards[0],
        { scale: 1.05 },
        { scale: 1, scrollTrigger: { trigger: cards[0], start: "top 110%", end: "center center", scrub: 0 } }
      );

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "center center",
          end: "+=200%",
          scrub: 0,
          pin: el,
          anticipatePin: 0,
        },
      });
      // Two transitions for three cards. Each step: incoming card → rest,
      // everyone already visible pushed up ~10% and scaled down 0.05.
      tl.addLabel("a")
        .to(cards[0], { yPercent: -10, scale: 0.95 }, "a")
        .to(cards[1], { yPercent: 0, scale: 1 }, "a")
        .addLabel("b")
        .to(cards[0], { yPercent: -20, scale: 0.9 }, "b")
        .to(cards[1], { yPercent: -10, scale: 0.95 }, "b")
        .to(cards[2], { yPercent: 0, scale: 1 }, "b");

      return () => el.classList.remove("is-pinned");
    });

    mm.add("(max-width: 1023px)", () => {
      gsap.utils.toArray<HTMLElement>(".pillar-card", el).forEach((card) => {
        gsap.fromTo(
          card,
          { yPercent: 15, scale: 0.95 },
          {
            yPercent: 0,
            scale: 1,
            scrollTrigger: { trigger: card, start: "-10% bottom", end: "60% center", scrub: 1 },
          }
        );
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={wrap} className="pillar-deck relative flex flex-col gap-8">
      {pillars.map((p, i) => {
        // Main word fills the card. ponytail: bucket by line count + longest
        // line — a short single word goes huge, a 2-line word (Brother/Hood)
        // steps down so both lines fit, a long single word steps down for
        // width. Retune caps if a title outgrows these.
        const lines = p.titleBottom.split("\n");
        const longest = Math.max(...lines.map((l) => l.length));
        const mainSize =
          lines.length > 1
            ? "text-[clamp(3.5rem,14vw,11rem)] leading-[0.95]"
            : longest > 7
              ? "text-[clamp(3rem,12vw,10rem)]"
              : "text-[clamp(6rem,25vw,23rem)]";
        return (
          <article
            key={p.titleBottom}
            className={cn(
              "pillar-card relative flex min-h-[480px] flex-col justify-between overflow-hidden rounded-[2rem] p-8 sm:p-14 lg:p-20",
              CARD_BG[i]
            )}
            style={{ zIndex: i }}
          >
            {/* Reference (img2) layout: large subject, vertically centred on the
                right; the wrapper holds the position so the img can idle-float
                (lk-float) like the page's other cutouts. imgClass (per-pillar)
                overrides size/position — else bigImg vs the smaller bible box.
                Left-fade mask keeps the title legible where they meet. */}
            <div
              className={cn(
                "pointer-events-none absolute z-0",
                // Mobile: small, faint accent tucked upper-right, clear of the
                // tags/body so it never crowds the copy. ponytail: nudge if a
                // subject still collides on very small screens.
                "right-0 top-5 h-[38%] max-w-[44%]",
                // lg+: the tuned per-pillar placement (vertically centred, big).
                "lg:top-1/2 lg:-translate-y-1/2",
                p.imgClass ??
                  (p.bigImg
                    ? "lg:right-[16%] lg:h-[98%] lg:max-w-[64%]"
                    : "lg:right-[4%] lg:h-[78%] lg:max-w-[46%]")
              )}
            >
              <img
                src={p.img}
                alt=""
                aria-hidden="true"
                draggable={false}
                className="lk-float subject-grade h-full w-auto object-contain opacity-40 lg:opacity-60"
                style={{
                  maskImage: "linear-gradient(to left, #000 55%, transparent)",
                  WebkitMaskImage: "linear-gradient(to left, #000 55%, transparent)",
                }}
              />
            </div>

            <h3 className="relative z-10 font-display font-bold uppercase leading-[0.78] tracking-tight">
              <span className="block text-2xl text-bone sm:text-3xl lg:text-4xl">{p.titleTop}</span>
              <span className={cn("block whitespace-pre-line text-dim", mainSize)}>{p.titleBottom}</span>
            </h3>

            <div className="relative z-10 mt-10 flex flex-col gap-6">
              <div className="flex flex-wrap items-center gap-2.5">
                {p.tags.map((t) => {
                  const TagIcon = t.icon;
                  return (
                    <MagneticPill
                      key={t.label}
                      className={cn(
                        "inline-flex cursor-default select-none items-center gap-2 rounded-full px-4 py-2 font-display text-sm font-semibold uppercase tracking-wider text-bone",
                        PILL_BG[i]
                      )}
                    >
                      <TagIcon className="h-4 w-4 text-gold" strokeWidth={2} />
                      {t.label}
                    </MagneticPill>
                  );
                })}
              </div>
              <div className="flex items-start gap-3">
                <SparkIcon className="lk-spin hidden h-8 w-8 shrink-0 text-gold sm:block" />
                <p className="max-w-[48ch] font-serif text-lg leading-relaxed text-bone-2 sm:text-xl">
                  {p.body}
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};

const MENU_LINKS = [
  { to: "/signup", label: "Take your place" },
  { to: "/login", label: "I'm a brother" },
  { to: "/privacy", label: "Privacy" },
  { to: "/terms", label: "Terms" },
];

/** The two-dot glyph in its own circle. Idles horizontal ("⋯"); rotates 90°
 *  on hover of the parent `.group` button, turning vertical (sohub's menu icon).
 *  `dark` picks a circle tint that reads on the pill's background. */
const MenuDots = ({ dark }: { dark: boolean }) => (
  <span
    className={cn(
      "grid h-6 w-6 place-items-center rounded-full transition-transform duration-500 ease-[cubic-bezier(.22,.68,0,1.5)] group-hover:rotate-90",
      dark ? "bg-white/10" : "bg-black/10"
    )}
  >
    <span className="flex gap-[3px]">
      <span className="h-[3px] w-[3px] rounded-full bg-current" />
      <span className="h-[3px] w-[3px] rounded-full bg-current" />
    </span>
  </span>
);

/** sohub-style hinged menu: the button label vertical-slides (Menu↔Close) and
 *  its dot icon rotates on hover; the panel is flung off to the right + tilted
 *  when closed and springs back to rest (natural overshoot) when opened. */
export const HingedMenu = ({ enterTo, dark = false }: { enterTo: string; dark?: boolean }) => {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const links = MENU_LINKS.map((l) => (l.label === "Take your place" ? { ...l, to: enterTo } : l));
  const label = "block transition-transform duration-500 ease-[cubic-bezier(.22,.68,0,1.2)]";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className={cn(
          "group relative z-50 flex items-center gap-2.5 rounded-full py-2.5 pl-5 pr-2.5 font-display text-sm font-semibold uppercase tracking-wider transition-transform duration-500 ease-[cubic-bezier(.22,.68,0,1)] hover:scale-110",
          dark ? "bg-forge text-bone" : "bg-bone text-primary-foreground"
        )}
      >
        {/* Clip box: "Close" (widest) sizes it invisibly; both real labels are
            absolute and slide vertically so one leaves as the other arrives. */}
        <span className="relative inline-block h-[1.1em] overflow-hidden">
          <span aria-hidden="true" className="invisible">Close</span>
          <span className={cn("absolute left-0 top-0", label, open ? "-translate-y-full" : "translate-y-0")}>
            Menu
          </span>
          <span className={cn("absolute left-0 top-0", label, open ? "translate-y-0" : "translate-y-full")}>
            Close
          </span>
        </span>
        <MenuDots dark={dark} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 cursor-default bg-forge/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.nav
              key="panel"
              // Closed rest: flung off-right (126% of own width) + tilted 8°.
              // Opens to 0/0 on a spring, so it overshoots slightly then settles.
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: "126%", rotate: 8 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, x: 0, rotate: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: "126%", rotate: 8 }}
              transition={reduce ? { duration: 0.2 } : { type: "spring", stiffness: 220, damping: 22 }}
              style={{ transformOrigin: "top right" }}
              className="absolute right-0 top-full z-50 mt-3 w-[min(90vw,420px)] rounded-3xl border border-line bg-forge-2 p-6 shadow-elevated"
            >
              <ul className="flex flex-col gap-1 pt-2">
                {links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      onClick={() => setOpen(false)}
                      onMouseEnter={() => prefetchRoute(l.to)}
                      onFocus={() => prefetchRoute(l.to)}
                      className="block rounded-2xl px-4 py-3 font-display text-3xl font-semibold uppercase tracking-wide text-bone transition-colors duration-200 hover:bg-raised-2 sm:text-4xl"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
