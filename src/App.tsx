import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { UnreadProvider } from "@/contexts/UnreadContext";
import AuthGuard from "@/components/guards/AuthGuard";
import EntitlementGuard from "@/components/guards/EntitlementGuard";
import OnboardingGuard from "@/components/guards/OnboardingGuard";
import AdminGuard from "@/components/guards/AdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminAuditLog from "@/components/admin/AdminAuditLog";
import AdminAnnouncements from "@/components/admin/AdminAnnouncements";
import AdminCommunity from "@/components/admin/AdminCommunity";
import AdminSettings from "@/components/admin/AdminSettings";
import CurriculumOverview from "@/components/admin/curriculum/CurriculumOverview";
import WeekDetail from "@/components/admin/curriculum/WeekDetail";
import CurriculumLessonEditor from "@/components/admin/curriculum/CurriculumLessonEditor";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Tools from "./pages/Tools";
import Rhythms from "./pages/Rhythms";
import Brotherhood from "./pages/Brotherhood";
import Library from "./pages/Library";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SetupAccount from "./pages/SetupAccount";
import ThankYou from "./pages/ThankYou";
import Upgrade from "./pages/Upgrade";
import Billing from "./pages/Billing";
import AppDashboard from "./pages/AppDashboard";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Profile from "./pages/Profile";
import LessonView from "./pages/LessonView";
import Onboarding from "./pages/Onboarding";
import Chat from "./pages/Chat";
import ChangePassword from "./pages/ChangePassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <UnreadProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/setup-account" element={<SetupAccount />} />
            <Route path="/checkout" element={<Navigate to="/app/upgrade" replace />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />

            {/* Auth-required but no entitlement needed */}
            <Route path="/change-password" element={<AuthGuard><ChangePassword /></AuthGuard>} />
            <Route path="/upgrade" element={<AuthGuard><Upgrade /></AuthGuard>} />
            <Route path="/billing" element={<AuthGuard><Billing /></AuthGuard>} />
            <Route path="/onboarding" element={<AuthGuard><Onboarding /></AuthGuard>} />

            {/* Entitlement-gated app routes (with onboarding check) */}
            <Route path="/app" element={<EntitlementGuard><OnboardingGuard><AppDashboard /></OnboardingGuard></EntitlementGuard>} />
            <Route path="/tools" element={<EntitlementGuard><OnboardingGuard><Tools /></OnboardingGuard></EntitlementGuard>} />
            <Route path="/rhythms" element={<EntitlementGuard><OnboardingGuard><Rhythms /></OnboardingGuard></EntitlementGuard>} />
            <Route path="/brotherhood" element={<EntitlementGuard><OnboardingGuard><Brotherhood /></OnboardingGuard></EntitlementGuard>} />
            <Route path="/library" element={<EntitlementGuard><OnboardingGuard><Library /></OnboardingGuard></EntitlementGuard>} />
            <Route path="/library/lesson/:lessonId" element={<EntitlementGuard><OnboardingGuard><LessonView /></OnboardingGuard></EntitlementGuard>} />
            <Route path="/chat" element={<EntitlementGuard><OnboardingGuard><Chat /></OnboardingGuard></EntitlementGuard>} />
            <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />

            {/* Admin */}
            <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
              <Route index element={<AdminDashboard />} />
              <Route path="curriculum" element={<CurriculumOverview />} />
              <Route path="curriculum/weeks/:weekId" element={<WeekDetail />} />
              <Route path="curriculum/weeks/:weekId/lessons/:lessonId" element={<CurriculumLessonEditor />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="community" element={<AdminCommunity />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="audit-log" element={<AdminAuditLog />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </UnreadProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
