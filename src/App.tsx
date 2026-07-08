import { Component, Suspense, lazy, useEffect, type ErrorInfo, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
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
import Landing from "./pages/forge/Landing";

// Route-level code splitting: every page below ships as its own chunk,
// fetched on first navigation, so the entry bundle stays small. Landing is
// deliberately eager — it renders the "/" route and lazy-loading it would
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

const queryClient = new QueryClient();

/**
 * Root error boundary. Without one, any uncaught render/effect error makes
 * React unmount the entire tree, which reads as a dead blank page. This
 * renders a recoverable screen and logs the real error to the console.
 */
class RootErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Uncaught app error:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="grid min-h-dvh place-items-center bg-background px-6 text-center">
        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-dim">
            Something broke
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold uppercase tracking-wide text-bone">
            Steady. Nothing is lost.
          </h1>
          <p className="mx-auto mt-3 max-w-[40ch] text-sm text-bone-2">
            The app hit an unexpected error. Reload and you'll be right back where you were.
          </p>
          <p className="mt-3 font-mono text-xs text-dim">{this.state.error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}

const ScrollToTop = () => {
  const { pathname } = useLocation();
  // Block body on purpose: some environments make scrollTo return a Promise,
  // and an implicit return would hand React a non-function "cleanup" that
  // crashes the tree on the next navigation.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App = () => (
  <RootErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <UnreadProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ImpersonationProvider>
                <ImpersonationBanner />
                <ScrollToTop />
                <RouteMeta />
                {/* One Suspense boundary for every lazy route: chunk loads
                    swap the whole viewport for the fallback instead of
                    leaving half-rendered shells behind. */}
                <Suspense fallback={<RouteFallback />}>
                  <Routes>
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
                            <StandFirm />
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
                            <AppShell />
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
                    <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
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
              </ImpersonationProvider>
            </BrowserRouter>
          </UnreadProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </RootErrorBoundary>
);

export default App;
