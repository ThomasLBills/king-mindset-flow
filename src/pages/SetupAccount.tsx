import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, KeyRound, Loader2, ArrowRight, ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import lkLogo from "@/assets/lk-logo-horizontal.png";

type PageState = "form" | "expired" | "submitting";

const SetupAccount = () => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pageState, setPageState] = useState<PageState>("form");
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signInWithPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setPageState("submitting");

    const { data, error } = await supabase.functions.invoke("verify-code-set-password", {
      body: { email: email.trim(), code: code.trim(), password },
    });

    if (error || !data?.success) {
      const errMsg = data?.error || error?.message || "Something went wrong";
      if (errMsg === "expired") {
        setPageState("expired");
        return;
      }
      setPageState("form");
      toast({ title: "Error", description: errMsg === "expired" ? "Code expired" : errMsg, variant: "destructive" });
      return;
    }

    // Password set successfully — sign in automatically
    const { error: signInError } = await signInWithPassword(email.trim(), password);
    if (signInError) {
      toast({ title: "Password created!", description: "Please sign in with your new password." });
      navigate("/login", { replace: true });
    } else {
      // Will auto-redirect via Login's useEffect or navigate to onboarding
      navigate("/app", { replace: true });
    }
  };

  const handleResendCode = async () => {
    if (!email.trim()) {
      toast({ title: "Enter your email first", variant: "destructive" });
      return;
    }
    setResending(true);
    await supabase.functions.invoke("send-verification-code", {
      body: { email: email.trim() },
    });
    setResending(false);
    setCode("");
    setPageState("form");
    toast({ title: "New code sent!", description: "Check your email for a fresh verification code." });
  };

  // --- Expired code state ---
  if (pageState === "expired") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <img src={lkLogo} alt="Liberated Kings" className="h-16 object-contain" />
          </div>
          <Card className="card-elevated border border-primary/40">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-primary mx-auto" />
              <p className="font-serif text-xl font-semibold">Code Expired</p>
              <p className="text-sm text-muted-foreground">
                Your verification code has expired. Click below to receive a new one.
              </p>
              <Button onClick={handleResendCode} className="w-full" size="lg" disabled={resending}>
                {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RefreshCw className="w-4 h-4 mr-2" /> Resend Code</>}
              </Button>
              <button type="button" onClick={() => navigate("/login")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-3 h-3 inline mr-1" /> Back to login
              </button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // --- Main form ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src={lkLogo} alt="Liberated Kings" className="h-16 object-contain" />
        </div>
        <Card className="card-elevated border border-primary/40">
          <CardHeader className="text-center">
            <CardTitle className="font-serif text-2xl">Create Your Account</CardTitle>
            <CardDescription>Enter the verification code from your email and choose a password.</CardDescription>
          </CardHeader>
          <CardContent>
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
                <KeyRound className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="6-digit verification code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="pl-10 text-center tracking-[0.3em] font-mono text-lg"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Create password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={pageState === "submitting"}>
                {pageState === "submitting" ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
              </Button>
            </form>
            <div className="mt-4 space-y-2 text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resending}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {resending ? "Sending..." : "Didn't get a code? Resend it"}
              </button>
              <div>
                <button type="button" onClick={() => navigate("/login")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="w-3 h-3 inline mr-1" /> Back to login
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SetupAccount;
