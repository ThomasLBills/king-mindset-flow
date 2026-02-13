import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AuthGuard from "@/components/guards/AuthGuard";
import EntitlementGuard from "@/components/guards/EntitlementGuard";
import AdminGuard from "@/components/guards/AdminGuard";
import Index from "./pages/Index";
import Tools from "./pages/Tools";
import Rhythms from "./pages/Rhythms";
import Brotherhood from "./pages/Brotherhood";
import Library from "./pages/Library";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Checkout from "./pages/Checkout";
import ThankYou from "./pages/ThankYou";
import Upgrade from "./pages/Upgrade";
import Billing from "./pages/Billing";
import Admin from "./pages/Admin";
import AppDashboard from "./pages/AppDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/thank-you" element={<ThankYou />} />

            {/* Auth-required but no entitlement needed */}
            <Route path="/upgrade" element={<AuthGuard><Upgrade /></AuthGuard>} />
            <Route path="/billing" element={<AuthGuard><Billing /></AuthGuard>} />

            {/* Entitlement-gated app routes */}
            <Route path="/app" element={<EntitlementGuard><AppDashboard /></EntitlementGuard>} />
            <Route path="/tools" element={<EntitlementGuard><Tools /></EntitlementGuard>} />
            <Route path="/rhythms" element={<EntitlementGuard><Rhythms /></EntitlementGuard>} />
            <Route path="/brotherhood" element={<EntitlementGuard><Brotherhood /></EntitlementGuard>} />
            <Route path="/library" element={<EntitlementGuard><Library /></EntitlementGuard>} />

            {/* Admin */}
            <Route path="/admin" element={<AdminGuard><Admin /></AdminGuard>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
