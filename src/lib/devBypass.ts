/**
 * Dev/preview auth bypass utility.
 * SECURITY: Only enabled when VITE_DEV_BYPASS_AUTH is explicitly set to "true"
 * AND running on localhost. Never enabled on deployed/preview domains.
 */
export function isDevBypassEnabled(): boolean {
  // Must be explicitly enabled
  if (import.meta.env.VITE_DEV_BYPASS_AUTH !== "true") return false;

  const hostname = window.location.hostname;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

  // Only allow bypass on localhost, never on deployed domains
  return isLocalhost;
}
