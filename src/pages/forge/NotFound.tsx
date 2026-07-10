import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/forge/atoms";
import { LkMonogram } from "@/components/forge/brand";
import { Grain } from "@/components/forge/scenes";

const NotFound = () => {
  // The SPA answers unknown URLs with HTTP 200 (soft 404), so tell crawlers not
  // to index this page. Removed on unmount so it never leaks to other routes.
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  return (
    <div className="lk-cream relative grid min-h-dvh place-items-center overflow-hidden bg-background px-6 text-center text-foreground">
      <Grain />
      <div className="relative">
        <LkMonogram tone="ink" className="mx-auto mb-6 h-8 w-11 opacity-80" />
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
};

export default NotFound;
