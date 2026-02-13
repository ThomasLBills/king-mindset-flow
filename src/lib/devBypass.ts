/**
 * Dev/preview auth bypass utility.
 * Requires BOTH:
 *   1. Running on localhost or a Lovable preview domain
 *   2. (Optional) VITE_DEV_BYPASS_AUTH=false to explicitly disable
 */
const LOVABLE_PREVIEW_PATTERNS = [
  /\.lovable\.app$/,
  /\.lovableproject\.com$/,
];

export function isDevBypassEnabled(): boolean {
  // Explicitly disabled
  if (import.meta.env.VITE_DEV_BYPASS_AUTH === "false") return false;

  const hostname = window.location.hostname;
  const isSafeHost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    LOVABLE_PREVIEW_PATTERNS.some((p) => p.test(hostname));

  return isSafeHost;
}
