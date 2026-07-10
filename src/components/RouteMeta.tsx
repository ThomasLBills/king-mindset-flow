import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const SITE_NAME = "Liberated Kings";
const CANONICAL_ORIGIN = "https://app.liberatedkings.com";

// Route → title, resolved by longest matching prefix so dynamic segments
// ("/app/grow/lesson/:lessonId") never need their own entry. "/" is handled
// as an exact match separately - treating it as a prefix would swallow every
// unknown path that should read "Page not found".
const ROUTE_TITLES: Array<[prefix: string, title: string]> = [
  ["/login", "Log in"],
  ["/forgot-password", "Forgot password"],
  ["/reset-password", "Reset password"],
  ["/setup-account", "Set up account"],
  ["/thank-you", "Thank you"],
  ["/privacy", "Privacy Policy"],
  ["/terms", "Terms of Service"],
  ["/change-password", "Change password"],
  ["/upgrade", "Upgrade"],
  ["/onboarding", "Onboarding"],
  ["/profile", "Profile"],
  ["/billing", "Billing"],
  ["/stand-firm", "Stand Firm"],
  ["/app", "Home"],
  ["/app/brotherhood", "Brotherhood"],
  ["/app/grow", "Path"],
  ["/app/grow/lesson", "Lesson"],
  ["/app/profile", "Profile"],
  ["/app/billing", "Billing"],
  ["/admin", "Admin"],
];

// Only public, indexable routes get a canonical URL. Everything behind auth
// resolves to a login wall for crawlers, so advertising a canonical there
// would only invite indexing of pages that can never render for a bot.
const INDEXABLE_PATHS = new Set(["/login", "/privacy", "/terms"]);

const resolveTitle = (pathname: string): string => {
  if (pathname === "/") return SITE_NAME;
  let best: string | null = null;
  let bestLength = 0;
  for (const [prefix, title] of ROUTE_TITLES) {
    // Match only on segment boundaries: "/app" covers "/app/grow" but must
    // not cover a hypothetical "/apples".
    if (pathname !== prefix && !pathname.startsWith(`${prefix}/`)) continue;
    if (prefix.length > bestLength) {
      best = title;
      bestLength = prefix.length;
    }
  }
  return best ? `${best} - ${SITE_NAME}` : `Page not found - ${SITE_NAME}`;
};

/**
 * Per-route document metadata and focus management, rendered once inside
 * BrowserRouter (next to ScrollToTop). Handles three things on navigation:
 * document.title, the canonical <link> for public routes, and moving focus
 * to the new page's h1 so screen readers announce the route change (the
 * standard WCAG SPA pattern - an SPA navigation fires no page-load event).
 */
const RouteMeta = () => {
  const { pathname } = useLocation();
  const isInitialMount = useRef(true);

  useEffect(() => {
    document.title = resolveTitle(pathname);

    // Maintain the canonical element imperatively rather than in JSX: it must
    // live in <head>, and this avoids pulling in a helmet-style dependency.
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (INDEXABLE_PATHS.has(pathname)) {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = `${CANONICAL_ORIGIN}${pathname}`;
    } else if (canonical) {
      canonical.remove();
    }
  }, [pathname]);

  useEffect(() => {
    // Skip the initial mount: stealing focus on first paint would hijack the
    // browser's default focus and break keyboard users' expectations.
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    // One frame's delay lets the destination route commit before we look for
    // its heading. Lazy routes still downloading show the Suspense fallback
    // (no h1), in which case we deliberately do nothing rather than focus a
    // stale heading from the previous page.
    const frame = requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>("h1");
      if (!heading) return;
      // preventScroll keeps this from fighting ScrollToTop, which already
      // owns the scroll position on navigation.
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
};

export default RouteMeta;
