import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LkMonogram } from "./brand";
import { Eyebrow } from "./atoms";
import { Grain, SceneRidge } from "./scenes";

/** Split editorial frame for login/signup: scene panel left, form right. */
const AuthLayout = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-[100dvh] bg-forge">
    <div className="relative hidden flex-1 overflow-hidden border-r border-line lg:block">
      <SceneRidge variant="tall" />
      <Grain />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forge via-transparent to-transparent"
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 bottom-0 p-10">
        <LkMonogram className="mb-5 h-9 w-12 text-gold" />
        <p className="max-w-[26ch] font-display text-3xl font-bold uppercase leading-tight tracking-wide text-bone">
          Freedom is fought for. Together.
        </p>
        <p className="mt-3 max-w-[44ch] font-serif italic text-bone-2">
          A Christ-centered brotherhood for men who are done fighting alone.
        </p>
      </div>
    </div>
    <div className="relative flex min-h-[100dvh] w-full flex-col justify-center px-6 py-12 lg:w-[480px] lg:shrink-0 lg:px-12">
      <Link to="/" className="mb-10 flex items-center gap-2.5 lg:hidden" aria-label="Liberated Kings home">
        <LkMonogram className="h-7 w-9 text-gold" />
        <Eyebrow tone="gold">Liberated Kings</Eyebrow>
      </Link>
      {children}
    </div>
  </div>
);

export default AuthLayout;
