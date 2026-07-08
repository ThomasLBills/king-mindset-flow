/**
 * Dev/preview auth bypass utility.
 *
 * SECURITY MODEL (defense in depth):
 *   1. Build time: `__DEV_BYPASS__` is a literal injected by vite.config.ts.
 *      It is `false` in every non-development build, so the branch below is
 *      dead-code eliminated from production bundles entirely. Additionally,
 *      vite.config.ts throws at build time if VITE_DEV_BYPASS_AUTH=true is
 *      set for a non-dev build, so a bypass artifact cannot be shipped.
 *   2. Runtime: even if the constant were somehow true, we still require the
 *      hostname to be localhost. Deployed domains can never bypass auth.
 */
export function isDevBypassEnabled(): boolean {
  // Build-time gate — production bundles compile this to `if (false) { ... }`
  // and the entire body is stripped by the bundler.
  if (!__DEV_BYPASS__) return false;

  // Runtime gate — belt-and-suspenders in case a dev build is served from
  // anywhere other than localhost.
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1";
}
