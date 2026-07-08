import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AuthLayout from "@/components/forge/AuthLayout";
import { Eyebrow } from "@/components/forge/atoms";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import { evaluatePassword } from "@/lib/passwordStrength";

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
    const strength = evaluatePassword(password);
    if (!strength.meetsRequirements) {
      toast({
        title: "Password not strong enough",
        description:
          "Use 10+ characters with an uppercase letter, a number, and a symbol (like #).",
        variant: "destructive",
      });
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
      <AuthLayout>
        <Eyebrow className="mb-2 block">Verification</Eyebrow>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
          Code expired
        </h1>
        <p className="mb-8 mt-2 text-sm text-bone-2">
          That code timed out — they don't last long, on purpose. Send yourself a fresh one.
        </p>
        <Button onClick={handleResendCode} className="w-full" size="lg" disabled={resending}>
          {resending ? "Sending…" : "Resend code"}
        </Button>
        <p className="mt-6 text-sm">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-dim underline-offset-4 transition-colors hover:text-bone-2 hover:underline"
          >
            Back to sign in
          </button>
        </p>
      </AuthLayout>
    );
  }

  // --- Main form ---
  return (
    <AuthLayout>
      <Eyebrow tone="gold" className="mb-2 block">
        Bought the course
      </Eyebrow>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
        Set up your account
      </h1>
      <p className="mb-8 mt-2 text-sm text-bone-2">
        Enter the verification code from your email and choose a password.
      </p>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="setup-email">Email</Label>
          <Input
            id="setup-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="setup-code">Verification code</Label>
          <Input
            id="setup-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="text-center font-mono text-lg tracking-[0.4em]"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="setup-password">Password</Label>
          <Input
            id="setup-password"
            type="password"
            autoComplete="new-password"
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={10}
          />
          <PasswordStrengthMeter password={password} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="setup-confirm">Confirm password</Label>
          <Input
            id="setup-confirm"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={10}
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={
            pageState === "submitting" ||
            !evaluatePassword(password).meetsRequirements ||
            password !== confirm
          }
        >
          {pageState === "submitting" ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <div className="mt-6 flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={handleResendCode}
          disabled={resending}
          className="text-dim underline-offset-4 transition-colors hover:text-bone-2 hover:underline disabled:opacity-60"
        >
          {resending ? "Sending…" : "Didn't get a code? Resend it"}
        </button>
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="text-dim underline-offset-4 transition-colors hover:text-bone-2 hover:underline"
        >
          Back to sign in
        </button>
      </div>
    </AuthLayout>
  );
};

export default SetupAccount;
