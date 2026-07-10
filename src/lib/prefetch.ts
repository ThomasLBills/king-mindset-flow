/**
 * Warm lazy route chunks before navigation so Suspense doesn't flash a
 * fallback the first time you visit a public page. The specifiers match
 * App.tsx's lazy() calls — Vite resolves both to the same chunk, so calling
 * here just primes the module cache; lazy() then resolves instantly.
 */
const loaders: Record<string, () => Promise<unknown>> = {
  "/login": () => import("@/pages/forge/Login"),
  "/privacy": () => import("@/pages/forge/Legal"),
  "/terms": () => import("@/pages/forge/Legal"),
};

/** Prime one route's chunk (e.g. on link hover/focus). No-op for unknown paths. */
export const prefetchRoute = (path: string) => {
  loaders[path]?.();
};

/** Warm the whole public funnel (auth + legal) once the browser is idle, so the
 *  landing's CTAs land on an already-downloaded page. */
export const prefetchPublic = () => {
  const run = () => ["/login", "/privacy"].forEach(prefetchRoute);
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => void })
    .requestIdleCallback;
  if (ric) ric(run);
  else setTimeout(run, 1500);
};
