import { Loader2 } from "lucide-react";

/**
 * Suspense fallback shown while a lazy route chunk downloads. Mirrors the
 * guards' loading screen exactly so a chunk fetch is indistinguishable from
 * an auth check — no theme flash between the two waiting states.
 */
const RouteFallback = () => (
  <div className="min-h-dvh flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

export default RouteFallback;
