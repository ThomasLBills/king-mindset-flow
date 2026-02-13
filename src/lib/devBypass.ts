/**
 * Dev/preview auth bypass utility.
 * Requires BOTH:
 *   1. VITE_DEV_BYPASS_AUTH=true
 *   2. Running on localhost or a Lovable preview domain
 */
const LOVABLE_PREVIEW_PATTERN = /\.lovable\.app$/;

export function isDevBypassEnabled(): boolean {
  const envFlag = import.meta.env.VITE_DEV_BYPASS_AUTH === "true";
  if (!envFlag) return false;

  const hostname = window.location.hostname;
  const isSafeHost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    LOVABLE_PREVIEW_PATTERN.test(hostname);

  return isSafeHost;
}
