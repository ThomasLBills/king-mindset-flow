import { Component, useEffect, type ErrorInfo, type ReactNode } from "react";
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
import AdminLayout from "@/components/admin/AdminLayout";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminEntitlements from "@/components/admin/AdminEntitlements";
import AdminAuditLog from "@/components/admin/AdminAuditLog";
import AdminAnnouncements from "@/components/admin/AdminAnnouncements";
import AdminCommunity from "@/components/admin/AdminCommunity";
import AdminSettings from "@/components/admin/AdminSettings";
import CurriculumOverview from "@/components/admin/curriculum/CurriculumOverview";
import WeekDetail from "@/components/admin/curriculum/WeekDetail";
import CurriculumLessonEditor from "@/components/admin/curriculum/CurriculumLessonEditor";
import AppShell from "@/components/shell/AppShell";
import Landing from "./pages/forge/Landing";
import Login from "./pages/forge/Login";
import Signup from "./pages/forge/Signup";
import Onboarding from "./pages/forge/Onboarding";
import Today from "./pages/forge/Today";
import StandFirm from "./pages/forge/StandFirm";
import Brotherhood from "./pages/forge/Brotherhood";
import Grow from "./pages/forge/Grow";
import Lesson from "./pages/forge/Lesson";
import Rhythms from "./pages/forge/Rhythms";
import Profile from "./pages/forge/Profile";
import Billing from "./pages/forge/Billing";
import NotFound from "./pages/forge/NotFound";
import { Privacy, Terms } from "./pages/forge/Legal";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SetupAccount from "./pages/SetupAccount";
import ThankYou from "./pages/ThankYou";
import Upgrade from "./pages/Upgrade";
import ChangePassword from "./pages/ChangePassword";

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
      <div className="grid min-h-screen place-items-center bg-background px-6 text-center">
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
              </ImpersonationProvider>
            </BrowserRouter>
          </UnreadProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </RootErrorBoundary>
);

export default App;
