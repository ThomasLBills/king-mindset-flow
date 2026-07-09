import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUp,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  Clock,
  Hand,
  Handshake,
  HeartHandshake,
  Phone,
  Repeat,
  ScrollText,
  Sunrise,
  Trophy,
  Users,
  Wind,
} from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Eyebrow, FoilRule } from "@/components/forge/atoms";
import { LkWordmark } from "@/components/forge/brand";
import { Grain } from "@/components/forge/scenes";
import { LandingLoader } from "@/components/forge/LandingLoader";
import { useHeroIntro } from "@/components/forge/useHeroIntro";
import {
  FloatingSubject,
  HingedMenu,
  LinesReveal,
  ParallaxSubject,
  PillarDeck,
  useLenis,
} from "@/components/forge/landing-kit";

// The landing runs a light "cream" theme (bone bg, forge ink) — scoped to this
// page via classes, so the member app / admin keep the dark forge tokens.
const MUTED = "text-[hsl(var(--background)/0.72)]"; // forge ink, softened for body copy
// Footer nav pill (sohub-style). Colour is set per-instance so the same shape
// works on the light bar links and as the gold Go-up button.
const FOOTER_PILL =
  "group inline-flex items-center gap-2.5 rounded-full px-5 py-3 font-display text-sm font-semibold uppercase tracking-wider transition-transform duration-500 ease-[cubic-bezier(.22,.68,0,1)] hover:scale-105";
// Footer wordmark: each letter's rise is SCRUBBED by scroll position, not a
// triggered play. Scroll forward → letters climb; stop → they hold mid-reveal;
// scroll back → they sink. Each letter maps a staggered sub-range of the
// wordmark's scroll progress so they finish in sequence.
const KingLetter = ({
  char,
  progress,
  start,
  end,
  reduce,
}: {
  char: string;
  progress: MotionValue<number>;
  start: number;
  end: number;
  reduce: boolean | null;
}) => {
  const y = useTransform(progress, [start, end], ["100%", "0%"]);
  return (
    <motion.span className="inline-block" style={{ y: reduce ? "0%" : y }}>
      {char}
    </motion.span>
  );
};

const PILLARS = [
  {
    titleTop: "The",
    titleBottom: "Path",
    img: "/pics/hero-bible.png",
    tags: [
      { label: "Daily Word", icon: BookOpen },
      { label: "8 Weeks", icon: CalendarDays },
      { label: "Scripture", icon: ScrollText },
      { label: "The Habit", icon: Repeat },
      { label: "Renewal", icon: Sunrise },
    ],
    body: "Eight weeks that go after the thinking underneath the habit. Five minutes a day, every day, in the Word.",
  },
  {
    titleTop: "The",
    titleBottom: "Brother\nHood",
    img: "/pics/hero-cross.png",
    bigImg: true,
    tags: [
      { label: "Small Group", icon: Users },
      { label: "Real Names", icon: BadgeCheck },
      { label: "Accountability", icon: Handshake },
      { label: "1 AM", icon: Clock },
      { label: "Presence", icon: HeartHandshake },
    ],
    body: "Real men, real names. A small group that knows yours, notices your absence, and answers at 1 AM.",
  },
  {
    titleTop: "Stand",
    titleBottom: "Firm",
    img: "/pics/hero-armor.png",
    bigImg: true,
    imgClass: "right-[16%] h-[122%] max-w-[86%]",
    tags: [
      { label: "One Tap", icon: Hand },
      { label: "Breathe", icon: Wind },
      { label: "The Word", icon: BookOpen },
      { label: "The Call", icon: Phone },
      { label: "Victory", icon: Trophy },
    ],
    body: "One tap when the wave hits. Breathe, stand on the Word, call the brothers. The urge passes. You remain.",
  },
];


const Landing = () => {
  const { user } = useAuth();
  const enterTo = user ? "/app" : "/signup";
  useLenis();
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const [introReady, setIntroReady] = useState(false);
  useHeroIntro(heroRef, introReady);
  // Scroll progress across the footer wordmark's slice of the page — drives the
  // scrubbed per-letter rise (KingLetter).
  const kingRef = useRef<HTMLSpanElement>(null);
  const { scrollYProgress: kingProgress } = useScroll({
    target: kingRef,
    offset: ["start end", "end center"],
  });

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-bone text-forge">
      <LandingLoader onDone={() => setIntroReady(true)} />
      <Grain />

      {/* 1 — Persistent header + hinged menu (dark marks over the cream page) */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between px-6 py-5 lg:px-10">
          <Link to="/" aria-label="Liberated Kings">
            <LkWordmark tone="ink" className="h-11 w-auto sm:h-12" />
          </Link>
          <div className="flex items-center gap-3">
            <Button
              asChild
              className="hidden rounded-full px-5 transition-transform duration-500 ease-[cubic-bezier(.22,.68,0,1)] hover:scale-110 sm:inline-flex"
            >
              <Link to={enterTo}>Take your place</Link>
            </Button>
            <HingedMenu enterTo={enterTo} dark />
          </div>
        </div>
      </header>

      {/* 2 — Hero: giant solid wordmark, dark eagle pops over it. Wordmark +
          tagline/buttons share one shrink-to-fit column so the row aligns to the
          wordmark's edges; the eagle layers between (over the buttons, which stay
          clickable since it's pointer-events-none). */}
      <section ref={heroRef} className="relative min-h-dvh overflow-hidden">
        <div className="relative z-20 mx-auto flex min-h-dvh w-fit max-w-[92vw] flex-col justify-start pt-[8vh]">
          <h1
            aria-label="Liberated Kings"
            className="hero-word relative z-10 flex select-none flex-col items-center gap-[2vw] font-display font-bold uppercase leading-[0.78] tracking-tight text-forge"
          >
            <span className="block text-[18.5vw]">Liberated</span>
            <span className="block text-[29vw]">Kings</span>
          </h1>
          <FloatingSubject
            src="/pics/hero-eagle.png"
            className="hero-render left-1/2 top-[2%] z-30 w-[54vw] max-w-[760px] -translate-x-1/2"
            delay="120ms"
          />
          <div className="relative z-40 mt-10 flex w-full flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <p className="hero-tagline font-display text-3xl font-bold uppercase leading-[0.9] tracking-tight text-forge sm:text-5xl">
              Freedom is fought for. Together.
            </p>
            <div className="hero-cta flex shrink-0 flex-col gap-3 sm:flex-row">
              <Button asChild size="xl">
                <Link to={enterTo}>Take your place</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="xl"
                className="border-0 bg-[hsl(var(--background)/0.06)] text-forge hover:bg-forge hover:text-bone"
              >
                <Link to="/login">I'm already a brother</Link>
              </Button>
            </div>
          </div>
        </div>
        <span className="hero-scroll lk-scroll-cue absolute bottom-6 right-6 z-40 font-display text-xs font-semibold uppercase tracking-[0.3em] text-[hsl(var(--background)/0.5)]">
          Scroll
        </span>
      </section>

      {/* 3 — Manifesto: full-width shimmer headline + big statement, with the
          sword as a foreground overlay. Everything fades/drifts in on scroll-in
          and out on scroll-out (lk-reveal-io). */}
      <section className="relative overflow-hidden py-32 sm:py-44">
        <div className="relative mx-auto max-w-[1800px] px-6">
          {/* z-20 overlay drifting with scroll — pulled in over the text for a
              partial overlap (pointer-events-none, so it never blocks). */}
          <ParallaxSubject
            src="/pics/hero-sword.png"
            rotate={6}
            distance={90}
            className="right-[6%] top-[8%] z-20 hidden w-[62vw] max-w-[860px] lg:block"
          />
          <div className="relative z-10">
            <p className="font-display text-2xl font-bold uppercase tracking-wide text-gold-deep sm:text-3xl">
              Purpose
            </p>
            <LinesReveal className="mt-6 font-sans text-[clamp(2rem,6vw,7rem)] font-bold leading-[1.02] tracking-tight text-forge">
              Eight weeks, real brothers, help the moment the pull hits.{" "}
              <span className="lk-shimmer-word">Grace</span>, not shame.
            </LinesReveal>
          </div>
        </div>
      </section>

      {/* 4 — Pillars as a sohub-style pinned deck (desktop) / stacked list (mobile) */}
      <section className="relative mx-auto max-w-[1600px] px-6 pb-24">
        <Eyebrow className="mb-10 block text-center text-gold-deep">How men get free here</Eyebrow>
        <PillarDeck pillars={PILLARS} />
      </section>

      {/* 5 — Scripture band (breather) */}
      <section>
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <LinesReveal className="font-serif text-2xl italic leading-relaxed text-forge sm:text-3xl">
            “Take up the whole armor of God, that you may be able to withstand in the evil day, and
            having done all, to <span className="lk-shimmer-word">stand firm</span>.”
          </LinesReveal>
          <div className="lk-reveal">
            <Eyebrow className="mt-6 inline-block text-gold-deep">Ephesians 6:13</Eyebrow>
            <FoilRule className="mx-auto mt-6" />
          </div>
        </div>
      </section>

      {/* 6 — CTA: God's hand reaching for you. Hand is an overlay (z-20, above the
          copy) that bleeds off the right edge — page overflow-x-clip eats the bleed. */}
      <section className="relative">
        <FloatingSubject
          src="/pics/hero-hand.png"
          className="right-[-13%] top-1/2 z-20 hidden w-[72vw] max-w-[1320px] -translate-y-1/2 -rotate-[22deg] lg:block"
        />
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-32 text-center lg:py-44 lg:text-left">
          <LinesReveal className="mx-auto flex flex-col items-center font-sans font-bold leading-[0.9] tracking-tight text-forge lg:mx-0 lg:items-start">
            <span className="block text-[clamp(3rem,10vw,9rem)]">Don't</span>
            <span className="lk-shimmer-word -mb-[0.14em] block pb-[0.14em] text-[clamp(3rem,10vw,9rem)]">fight</span>
            <span className="block text-[clamp(3rem,10vw,9rem)]">alone</span>
          </LinesReveal>
          <div className="lk-reveal mt-12 flex flex-col items-center gap-4 sm:flex-row lg:items-start">
            <Button
              asChild
              size="xl"
              className="h-16 rounded-full px-9 text-base transition-transform duration-500 ease-[cubic-bezier(.22,.68,0,1)] hover:scale-105"
            >
              <Link to={enterTo}>Take your place</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="xl"
              className="h-16 rounded-full border-0 bg-[hsl(var(--background)/0.06)] px-9 text-base text-forge transition-transform duration-500 ease-[cubic-bezier(.22,.68,0,1)] hover:scale-105 hover:bg-forge hover:text-bone"
            >
              <Link to="/login">I'm already a brother</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 8 — Footer (sohub-style): giant KINGS wordmark, crown cresting the seam,
          dark card with the © lockup, and a nav-pill bar tucked under it. The
          "rising" feel is Lenis inertia + the crown's idle bob — no scroll JS.
          overflow-x-clip eats the wordmark's horizontal bleed while letting the
          crown overflow upward. */}
      <footer className="relative overflow-x-clip pt-24 sm:pt-28">
        {/* Giant wordmark — the per-letter rise is SCRUBBED by scroll (see
            KingLetter): scroll down and letters climb, stop and they hold, scroll
            back up and they sink. clip-path hides the below-start travel while
            leaving the cap tops uncropped (leading-0.7 is too tight for plain
            overflow-hidden). The card below pulls up to overlap it. */}
        <span
          ref={kingRef}
          aria-hidden="true"
          className="block select-none text-center font-display text-[32vw] font-bold uppercase leading-[0.7] tracking-tight text-forge [clip-path:inset(-0.4em_0_0_0)]"
        >
          {"King".split("").map((ch, i) => (
            <KingLetter
              key={i}
              char={ch}
              progress={kingProgress}
              start={i * 0.12}
              end={i * 0.12 + 0.5}
              reduce={reduce}
            />
          ))}
        </span>

        <div className="relative z-10 mx-auto -mt-[7%] max-w-[1200px] px-4 sm:px-6">
          {/* Crown crests the card's top edge, overlapping the wordmark behind it. */}
          <FloatingSubject
            src="/pics/hero-crown.png"
            className="left-1/2 top-0 z-20 w-[76vw] max-w-[880px] -translate-x-1/2 -translate-y-[40%]"
            delay="80ms"
          />

          {/* Dark card — the inverse of the cream page (bg-forge / text-bone).
              Content sits toward the bottom (justify-end), sohub-style. */}
          <div className="relative z-10 flex min-h-[clamp(360px,40vw,600px)] flex-col items-center justify-end overflow-hidden rounded-[28px] bg-forge px-6 pb-14 text-center sm:px-10 sm:pb-16">
            <h2 className="font-sans text-[clamp(2.25rem,7.5vw,7rem)] font-bold leading-none tracking-tight text-bone">
              © Liberated Kings
            </h2>
            <p className="mt-5 font-display text-sm font-semibold uppercase tracking-[0.3em] text-bone/55 sm:text-base">
              Stand firm.
            </p>
          </div>

          {/* Nav-pill bar tucked behind the card's rounded bottom (z-0, narrower,
              flat top) so the two read as one seamless block. The negative margin
              holds its resting slot; on first scroll-in it slides down once from
              translateY(-100%) (tucked behind the card) — sohub's exact reveal. */}
          <motion.div
            initial={reduce ? false : { y: "-100%" }}
            whileInView={{ y: 0 }}
            viewport={{ once: false, amount: 0.55 }}
            transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-0 mx-auto -mt-8 flex w-[94%] flex-col items-center justify-between gap-5 rounded-b-[28px] bg-forge-2 px-6 pb-6 pt-14 sm:flex-row sm:px-10"
          >
            <nav className="flex flex-wrap items-center justify-center gap-2.5">
              <Link to={enterTo} className={`${FOOTER_PILL} bg-bone text-forge`}>
                Take your place <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className={`${FOOTER_PILL} bg-bone text-forge`}>
                I'm a brother <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link to="/privacy" className={`${FOOTER_PILL} bg-bone text-forge`}>
                Privacy <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link to="/terms" className={`${FOOTER_PILL} bg-bone text-forge`}>
                Terms <ArrowUpRight className="h-4 w-4" />
              </Link>
            </nav>
            <button
              type="button"
              // ponytail: native smooth-scroll. If it ever fights Lenis, return
              // lenis.scrollTo from useLenis and call that instead.
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className={`${FOOTER_PILL} shrink-0 bg-gold text-forge`}
            >
              Go up <ArrowUp className="h-4 w-4" />
            </button>
          </motion.div>

          <p className="py-8 text-center font-display text-xs uppercase tracking-[0.2em] text-[hsl(var(--background)/0.4)]">
            © {new Date().getFullYear()} Liberated Kings · Ephesians 6:13
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
