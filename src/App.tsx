import { Suspense, lazy, useEffect, useRef } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AuthProvider } from "@/hooks/useAuth";
import { prefetchPublic } from "@/lib/prefetch";
import { UnreadProvider } from "@/contexts/UnreadContext";
import { ImpersonationProvider } from "@/contexts/ImpersonationContext";
import ImpersonationBanner from "@/components/impersonation/ImpersonationBanner";
import AuthGuard from "@/components/guards/AuthGuard";
import EntitlementGuard from "@/components/guards/EntitlementGuard";
import OnboardingGuard from "@/components/guards/OnboardingGuard";
import AdminGuard from "@/components/guards/AdminGuard";
import AppShell from "@/components/shell/AppShell";
import RouteFallback from "@/components/RouteFallback";
import RouteMeta from "@/components/RouteMeta";
import { makeQueryClient } from "@/lib/queryClient";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ConfirmProvider, ErrorState } from "@/components/feedback";
import { OfflineBanner } from "@/components/OfflineBanner";
import Landing from "./pages/forge/Landing";

// Route-level code splitting: every page below ships as its own chunk,
// fetched on first navigation, so the entry bundle stays small. Landing is
// deliberately eager - it renders the "/" route and lazy-loading it would
// push LCP behind a second network round trip for first-time visitors.
// Guards, providers, and AppShell stay eager because they wrap every route.
const Login = lazy(() => import("./pages/forge/Login"));
const Signup = lazy(() => import("./pages/forge/Signup"));
const Onboarding = lazy(() => import("./pages/forge/Onboarding"));
const Today = lazy(() => import("./pages/forge/Today"));
const StandFirm = lazy(() => import("./pages/forge/StandFirm"));
const Brotherhood = lazy(() => import("./pages/forge/Brotherhood"));
const Grow = lazy(() => import("./pages/forge/Grow"));
const Lesson = lazy(() => import("./pages/forge/Lesson"));
const Rhythms = lazy(() => import("./pages/forge/Rhythms"));
const Profile = lazy(() => import("./pages/forge/Profile"));
const Billing = lazy(() => import("./pages/forge/Billing"));
const NotFound = lazy(() => import("./pages/forge/NotFound"));
// Legal.tsx has named exports only; lazy() expects a default, so re-shape
// the module on the fly. Both pages still share one chunk.
const Privacy = lazy(() => import("./pages/forge/Legal").then((m) => ({ default: m.Privacy })));
const Terms = lazy(() => import("./pages/forge/Legal").then((m) => ({ default: m.Terms })));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const SetupAccount = lazy(() => import("./pages/SetupAccount"));
const ThankYou = lazy(() => import("./pages/ThankYou"));
const Upgrade = lazy(() => import("./pages/Upgrade"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const AdminLayout = lazy(() => import("@/components/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("@/components/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("@/components/admin/AdminUsers"));
const AdminEntitlements = lazy(() => import("@/components/admin/AdminEntitlements"));
const AdminAuditLog = lazy(() => import("@/components/admin/AdminAuditLog"));
const AdminAnnouncements = lazy(() => import("@/components/admin/AdminAnnouncements"));
const AdminCommunity = lazy(() => import("@/components/admin/AdminCommunity"));
const AdminSettings = lazy(() => import("@/components/admin/AdminSettings"));
const CurriculumOverview = lazy(() => import("@/components/admin/curriculum/CurriculumOverview"));
const WeekDetail = lazy(() => import("@/components/admin/curriculum/WeekDetail"));
const CurriculumLessonEditor = lazy(() => import("@/components/admin/curriculum/CurriculumLessonEditor"));

const queryClient = makeQueryClient();

/**
 * Full-screen fallback for the root boundary. Without a root boundary, any
 * uncaught render/effect error unmounts the whole tree (a dead blank page);
 * this renders a recoverable screen. The reusable <ErrorBoundary> logs the
 * real error to the console.
 */
const rootErrorFallback = (error: Error) => (
  <div className="grid min-h-dvh place-items-center bg-background px-6 text-center">
    <div>
      <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-dim">Something broke</p>
      <h1 className="mt-2 font-display text-3xl font-bold uppercase tracking-wide text-bone">
        Steady. Nothing is lost.
      </h1>
      <p className="mx-auto mt-3 max-w-[40ch] text-sm text-bone-2">
        The app hit an unexpected error. Reload and you'll be right back where you were.
      </p>
      <p className="mt-3 font-mono text-xs text-dim">{error.message}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
      >
        Reload
      </button>
    </div>
  </div>
);

// Compact fallback for a single area (outlet) so one panel's crash doesn't blank
// the whole app — it recovers in place via the boundary's reset.
const areaErrorFallback = (error: Error, reset: () => void) => (
  <div className="p-6">
    <ErrorState title="This section hit an error" message={error.message} onRetry={reset} />
  </div>
);

const ScrollToTop = () => {
  const { pathname } = useLocation();
  // Block body on purpose: some environments make scrollTo return a Promise,
  // and an implicit return would hand React a non-function "cleanup" that
  // crashes the tree on the next navigation.
  useEffect(() => {
    // The member shell scrolls inside #app-scroll, not the document, so reset
    // both: the container for /app routes, the window for everything else.
    document.getElementById("app-scroll")?.scrollTo?.(0, 0);
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Routes + a sohub-style stacked page transition. Both pages share ONE grid
 * cell, so it's a transform-only effect — normal document scroll / Lenis are
 * untouched, and no `position: fixed` overlay is needed (which would also trap
 * Landing's fixed header, since a transformed ancestor becomes its containing
 * block; framer resets transform to `none` at rest, so that only holds mid-flight).
 *
 * Only moves that INVOLVE the landing page animate — leaving it or returning to
 * it. Auth-to-auth hops (login ↔ signup ↔ setup-account) are near-identical
 * screens, so they just swap with no motion. When it does animate, both pages
 * slide up one viewport in lockstep: the outgoing page (z below) slides straight
 * up and off the top — full-size + opaque (blur is fine; NO scale/fade, which
 * would uncover the void behind) — while the incoming page (z above) rises from
 * below. The seam where they meet travels up and the viewport stays fully covered
 * the whole way. `custom` carries the decision to the *exiting* page too, so it's
 * destination-aware (framer forwards the latest custom to exits).
 */
const AnimatedRoutes = () => {
  const location = useLocation();
  const reduce = useReducedMotion();
  const areaKey = location.pathname.split("/")[1] || "home";

  // Animate only when this move leaves or returns to the landing page.
  const prevArea = useRef(areaKey);
  const moves = !reduce && (areaKey === "home" || prevArea.current === "home");
  useEffect(() => {
    prevArea.current = areaKey;
  }, [areaKey]);

  // Rise/settle exactly one viewport (transform only — never affects layout).
  const rise = typeof window !== "undefined" ? window.innerHeight : 800;
  const variants = {
    enter: (on: boolean) => ({ y: on ? rise : 0, opacity: 1, zIndex: 2 }),
    center: { y: 0, opacity: 1, zIndex: 2 },
    exit: (on: boolean) => ({
      y: on ? -rise : 0,
      opacity: 1,
      filter: on ? "blur(6px)" : "blur(0px)",
      zIndex: 1,
    }),
  };

  // Warm the public funnel (auth + legal) on idle so the CTAs land on an
  // already-downloaded page instead of the Suspense fallback.
  useEffect(() => {
    prefetchPublic();
  }, []);

  return (
    <div className="grid">
      <AnimatePresence initial={false} custom={moves}>
        <motion.div
          key={areaKey}
          custom={moves}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          // min-w-0: this is a grid item (gridArea 1/1). Grid items default to
          // min-width:auto, so a page whose min-content is wider than the
          // viewport (e.g. a long unbroken email in a table cell) stretches the
          // whole column past the screen — and body's overflow-x:clip cuts it
          // off instead of scrolling. min-w-0 lets the track clamp to the
          // viewport so wide content wraps/scrolls within its own container.
          className="min-w-0"
          style={{ gridArea: "1 / 1" }}
          transition={{ duration: moves ? 0.6 : 0, ease: EASE }}
        >
          {/* One Suspense boundary for every lazy route: chunk loads swap the
              whole viewport for the fallback instead of leaving half-rendered
              shells behind. */}
          <Suspense fallback={<RouteFallback />}>
            <Routes location={location}>
            {/* Public */}
            <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/setup-account" element={<SetupAccount />} />
                    <Route path="/checkout" element={<Navigate to="/upgrade" replace />} />
                    <Route path="/thank-you" element={<ThankYou />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />

                    {/* Signed in, no entitlement required */}
                    <Route path="/change-password" element={<AuthGuard><ChangePassword /></AuthGuard>} />
                    <Route path="/upgrade" element={<AuthGuard><Upgrade /></AuthGuard>} />
                    <Route path="/onboarding" element={<AuthGuard><Onboarding /></AuthGuard>} />
                    {/* Standalone profile/billing stay reachable without an active
                        subscription (manage/cancel/renew), matching production. */}
                    <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
                    <Route path="/billing" element={<AuthGuard><Billing /></AuthGuard>} />

                    {/* Crisis: full screen, outside the shell, one tap from anywhere */}
                    <Route
                      path="/stand-firm"
                      element={
                        <EntitlementGuard>
                          <OnboardingGuard>
                            <ErrorBoundary fallback={areaErrorFallback}>
                              <StandFirm />
                            </ErrorBoundary>
                          </OnboardingGuard>
                        </EntitlementGuard>
                      }
                    />

                    {/* Member app */}
                    <Route
                      path="/app"
                      element={
                        <EntitlementGuard>
                          <OnboardingGuard>
                            <ErrorBoundary fallback={areaErrorFallback}>
                              <AppShell />
                            </ErrorBoundary>
                          </OnboardingGuard>
                        </EntitlementGuard>
                      }
                    >
                      <Route index element={<Today />} />
                      <Route path="brotherhood" element={<Brotherhood />} />
                      <Route path="grow" element={<Grow />} />
                      <Route path="grow/lesson/:lessonId" element={<Lesson />} />
                      <Route path="rhythms" element={<Rhythms />} />
                      <Route path="profile" element={<Profile />} />
                      <Route path="billing" element={<Billing />} />
                    </Route>

                    {/* Admin */}
                    <Route path="/admin" element={<AdminGuard><ErrorBoundary fallback={areaErrorFallback}><AdminLayout /></ErrorBoundary></AdminGuard>}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="curriculum" element={<CurriculumOverview />} />
                      <Route path="curriculum/weeks/:weekId" element={<WeekDetail />} />
                      <Route path="curriculum/weeks/:weekId/lessons/:lessonId" element={<CurriculumLessonEditor />} />
                      <Route path="users" element={<AdminUsers />} />
                      <Route path="entitlements" element={<AdminEntitlements />} />
                      <Route path="community" element={<AdminCommunity />} />
                      <Route path="announcements" element={<AdminAnnouncements />} />
                      <Route path="audit-log" element={<AdminAuditLog />} />
                      <Route path="settings" element={<AdminSettings />} />
                    </Route>

                    {/* Legacy paths from the old IA */}
                    <Route path="/tools" element={<Navigate to="/stand-firm" replace />} />
                    <Route path="/library" element={<Navigate to="/app/grow" replace />} />
                    <Route path="/chat" element={<Navigate to="/app/brotherhood" replace />} />

                    <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const App = () => (
  <ErrorBoundary fallback={rootErrorFallback}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ConfirmProvider>
          <AuthProvider>
            <UnreadProvider>
              <Sonner />
              <OfflineBanner />
              <BrowserRouter>
                <ImpersonationProvider>
                  <ImpersonationBanner />
                  <ScrollToTop />
                  <RouteMeta />
                  <AnimatedRoutes />
                </ImpersonationProvider>
              </BrowserRouter>
            </UnreadProvider>
          </AuthProvider>
        </ConfirmProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
