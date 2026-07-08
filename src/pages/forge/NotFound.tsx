import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/forge/atoms";
import { LkMonogram } from "@/components/forge/brand";
import { Grain } from "@/components/forge/scenes";

const NotFound = () => (
  <div className="relative grid min-h-[100dvh] place-items-center overflow-hidden bg-forge px-6 text-center">
    <Grain />
    <div className="relative">
      <LkMonogram className="mx-auto mb-6 h-8 w-11 text-gold opacity-80" />
      <Eyebrow tone="gold" className="mb-2 block">
        404
      </Eyebrow>
      <h1 className="font-display text-4xl font-bold uppercase tracking-wide text-bone">
        Off the path
      </h1>
      <p className="mx-auto mt-3 max-w-[36ch] font-serif italic text-bone-2">
        This page isn't here. The road back is right where you left it.
      </p>
      <Button asChild className="mt-7">
        <Link to="/app">Back to Today</Link>
      </Button>
    </div>
  </div>
);

export default NotFound;
