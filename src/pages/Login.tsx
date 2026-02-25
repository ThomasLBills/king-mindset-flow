import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlement } from "@/hooks/useEntitlement";
import { Mail, Lock, ArrowRight, Loader2, MailOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import lkLogo from "@/assets/lk-logo-horizontal.png";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const { signInWithPassword, user } = useAuth();
  const { isEntitled, isLoading: entitlementLoading } = useEntitlement();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for success message from password reset
  const [successMessage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get("message");
    if (msg) {
      window.history.replaceState({}, "", "/login");
    }
    return msg;
  });

  useEffect(() => {
    if (!user) return;
    if (entitlementLoading) return;
    if (isEntitled) {
      navigate("/app", { replace: true });
    } else {
      navigate("/upgrade", { replace: true });
    }
  }, [user, isEntitled, entitlementLoading, navigate]);

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signInWithPassword(email, password);
    if (error) {
      // Check if this user exists but hasn't set a password yet
      try {
        const { data } = await supabase.functions.invoke("check-user-eligible", {
          body: { email },
        });
        if (data?.eligible && data?.password_set === false) {
          setNeedsPasswordSetup(true);
          setLoading(false);
          return;
        }
      } catch {
        // Ignore — fall through to normal error
      }
      setLoading(false);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  // Show "check your email" state for users who haven't set a password
  if (needsPasswordSetup) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <img src={lkLogo} alt="Liberated Kings" className="h-16 object-contain" />
          </div>
          <Card className="card-elevated border border-primary/40">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <MailOpen className="w-12 h-12 text-primary mx-auto" />
              <p className="font-serif text-xl font-semibold">Check Your Email</p>
              <p className="text-sm text-muted-foreground">
                We sent a setup link to <span className="font-medium text-foreground">{email}</span>. Open that email and click the link to create your password and access the app.
              </p>
              <p className="text-xs text-muted-foreground">
                Don't see it? Check your spam folder or contact support.
              </p>
              <Button variant="outline" onClick={() => setNeedsPasswordSetup(false)} className="w-full" size="lg">
                Back to Sign In
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src={lkLogo} alt="Liberated Kings" className="h-16 object-contain" />
        </div>
        <Card className="card-elevated border border-primary/40">
          <CardHeader className="text-center">
            <CardTitle className="font-serif text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to walk in your freedom.</CardDescription>
          </CardHeader>
          <CardContent>
            {successMessage && (
              <div className="mb-4 p-3 rounded-lg bg-success/10 text-success text-sm text-center font-medium">
                {successMessage}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
              </Button>
            </form>
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Forgot password?
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;