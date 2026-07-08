import { Link } from "react-router-dom";
import { BookOpen, Shield, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Eyebrow, FoilRule, SectionCard } from "@/components/forge/atoms";
import { LkMonogram, LkSeal, LkWordmark } from "@/components/forge/brand";
import { Grain, SceneRidge } from "@/components/forge/scenes";

const PILLARS = [
  {
    icon: BookOpen,
    title: "The Path",
    body: "Eight weeks that go after the thinking underneath the habit. Five minutes a day, every day.",
  },
  {
    icon: Users,
    title: "The Brotherhood",
    body: "Real men, real names. A small group that knows yours, notices your absence, and answers at 1 AM.",
  },
  {
    icon: Shield,
    title: "Stand Firm",
    body: "One tap when the wave hits. Breathe, stand on the Word, call the brothers. The urge passes. You remain.",
  },
];

const VOW_PREVIEW = [
  "I will not fight alone.",
  "I will tell the truth, especially the truth I want to hide.",
  "When I fall, I will return quickly, without hiding.",
];

const Landing = () => {
  const { user } = useAuth();
  const enterTo = user ? "/app" : "/signup";

  return (
    <div className="relative min-h-screen bg-forge">
      {/* Hero photo bleeds down past the fold, feathered out by a mask */}
      <SceneRidge className="h-[560px] [mask-image:linear-gradient(to_bottom,black_35%,transparent_100%)] lg:h-[660px]" />
      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" aria-label="Liberated Kings">
          <LkWordmark className="h-8 w-auto sm:h-9" />
        </Link>
        <nav className="flex items-center gap-3">
          <Button asChild variant="ghost" className="text-bone-2 hover:text-bone">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link to={enterTo}>{user ? "Enter" : "Take your place"}</Link>
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative">
        <Grain />
        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-16 sm:pt-24 lg:pb-32">
          <Eyebrow tone="gold" className="mb-4 block">
            A Christ-centered brotherhood for men
          </Eyebrow>
          <h1 className="max-w-[16ch] font-display text-5xl font-bold uppercase leading-[0.95] tracking-wide text-bone sm:text-7xl">
            Freedom is fought for. Together.
          </h1>
          <p className="mt-6 max-w-[46ch] font-serif text-lg italic leading-relaxed text-bone-2 sm:text-xl">
            Porn promised relief and delivered chains. Liberated Kings pairs an eight-week program
            with real brothers, plus help for the exact minute the pull hits. Grace, not shame.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="xl">
              <Link to={enterTo}>Take your place</Link>
            </Button>
            <Button asChild variant="outline" size="xl">
              <Link to="/login">I'm already a brother</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        <Eyebrow className="mb-8 block text-center">How men get free here</Eyebrow>
        <div className="grid gap-4 md:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <SectionCard key={title} className="p-6">
              <Icon className="mb-4 h-6 w-6 text-gold" aria-hidden="true" />
              <h2 className="font-display text-xl font-bold uppercase tracking-wide text-bone">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-bone-2">{body}</p>
            </SectionCard>
          ))}
        </div>
      </section>

      {/* Scripture band */}
      <section className="border-y border-line bg-forge-2">
        <div className="mx-auto max-w-3xl px-6 py-14 text-center">
          <p className="font-serif text-2xl italic leading-relaxed text-bone">
            “Take up the whole armor of God, that you may be able to withstand in the evil day, and
            having done all, to stand firm.”
          </p>
          <Eyebrow tone="gold" className="mt-4 inline-block">
            Ephesians 6:13
          </Eyebrow>
        </div>
      </section>

      {/* Covenant teaser */}
      <section className="relative overflow-hidden">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-6 py-16 lg:flex-row lg:py-24">
          <div className="relative shrink-0">
            <LkSeal className="h-44 w-44 text-gold opacity-70" />
          </div>
          <div>
            <Eyebrow tone="gold" className="mb-3 block">
              A covenant, not a subscription
            </Eyebrow>
            <h2 className="max-w-[22ch] font-display text-3xl font-bold uppercase tracking-wide text-bone sm:text-4xl">
              Membership starts with a vow, signed in your own name.
            </h2>
            <ul className="mt-6 flex flex-col gap-2.5">
              {VOW_PREVIEW.map((vow, i) => (
                <li key={vow} className="flex items-baseline gap-3">
                  <span className="font-display text-xs font-bold text-gold" aria-hidden="true">
                    {["I", "II", "III"][i]}
                  </span>
                  <p className="font-serif text-lg italic text-bone-2">{vow}</p>
                </li>
              ))}
            </ul>
            <FoilRule className="mt-7" />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-line bg-forge-2">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <h2 className="mx-auto max-w-[22ch] font-display text-3xl font-bold uppercase tracking-wide text-bone sm:text-4xl">
            The fight is common. Fighting alone is optional.
          </h2>
          <Button asChild size="xl" className="mt-8">
            <Link to={enterTo}>Take your place</Link>
          </Button>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 py-8 text-xs text-dim sm:flex-row sm:justify-between">
        <span className="flex items-center gap-2">
          <LkMonogram tone="dim" className="h-5 w-6" /> © {new Date().getFullYear()} Liberated Kings
        </span>
        <span className="flex gap-5">
          <Link to="/privacy" className="transition-colors hover:text-bone-2">
            Privacy
          </Link>
          <Link to="/terms" className="transition-colors hover:text-bone-2">
            Terms
          </Link>
        </span>
      </footer>
    </div>
  );
};

export default Landing;
