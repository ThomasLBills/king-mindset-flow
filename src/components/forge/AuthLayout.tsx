import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LkMonogram, LkWordmark } from "./brand";
import { Eyebrow } from "./atoms";
import { Grain, SceneRidge } from "./scenes";
import { MountReveal } from "./reveal";

/**
 * Split editorial frame for the public auth funnel (login/signup/reset/etc.),
 * running the landing's light "cream" look via the `.lk-cream` scope so every
 * shadcn form control renders correctly on the bone background. Scene panel
 * left (ridge photo + wordmark), form right.
 */
const AuthLayout = ({ children }: { children: ReactNode }) => (
  <div className="lk-cream flex min-h-dvh bg-background text-foreground">
    <div className="relative hidden flex-1 overflow-hidden border-r border-border lg:block">
      <SceneRidge variant="tall" />
      <Grain />
      {/* Cream-to-transparent lift so the bottom lockup always reads over the
          photo. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background via-background/80 to-transparent"
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 bottom-0 p-10">
        <LkWordmark tone="ink" className="mb-6 h-9 w-auto" />
        <p className="max-w-[22ch] font-display text-4xl font-bold uppercase leading-[0.92] tracking-tight text-foreground">
          Freedom is fought for. Together.
        </p>
        <p className="mt-4 max-w-[42ch] font-serif text-lg italic text-muted-foreground">
          A Christ-centered brotherhood for men who are done fighting alone.
        </p>
      </div>
    </div>
    <div className="relative flex min-h-dvh w-full flex-col justify-center px-6 py-12 lg:w-[520px] lg:shrink-0 lg:px-14">
      <MountReveal className="lg:hidden">
        <Link to="/" className="mb-10 flex items-center gap-2.5" aria-label="Liberated Kings home">
          <LkMonogram tone="ink" className="h-7 w-9" />
          <Eyebrow tone="gold">Liberated Kings</Eyebrow>
        </Link>
      </MountReveal>
      <MountReveal delay={0.12}>{children}</MountReveal>
    </div>
  </div>
);

export default AuthLayout;
