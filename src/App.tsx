import { Component, useEffect, type ErrorInfo, type ReactNode } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { MockAuthProvider, RequireAuth, RequireOnboarded } from "@/mock/auth";
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
        <MockAuthProvider>
          <Sonner />
          <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />

            {/* Signed in, pre-app */}
            <Route
              path="/onboarding"
              element={
                <RequireAuth>
                  <Onboarding />
                </RequireAuth>
              }
            />

            {/* Crisis: full screen, outside the shell, one tap from anywhere */}
            <Route
              path="/stand-firm"
              element={
                <RequireAuth>
                  <StandFirm />
                </RequireAuth>
              }
            />

            {/* Member app */}
            <Route
              path="/app"
              element={
                <RequireAuth>
                  <RequireOnboarded>
                    <AppShell />
                  </RequireOnboarded>
                </RequireAuth>
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

            {/* Legacy paths from the old IA */}
            <Route path="/tools" element={<Navigate to="/stand-firm" replace />} />
            <Route path="/library" element={<Navigate to="/app/grow" replace />} />
            <Route path="/chat" element={<Navigate to="/app/brotherhood" replace />} />
            <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
            <Route path="/billing" element={<Navigate to="/app/billing" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </MockAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </RootErrorBoundary>
);

export default App;
