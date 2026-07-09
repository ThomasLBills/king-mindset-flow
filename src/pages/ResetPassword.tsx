import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AuthLayout from "@/components/forge/AuthLayout";
import { Eyebrow } from "@/components/forge/atoms";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import { evaluatePassword } from "@/lib/passwordStrength";

type PageState = "loading" | "no-token" | "error" | "ready" | "done";

const ResetPassword = () => {
  const [pageState, setPageState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const exchangeToken = useCallback(async () => {
    const hash = window.location.hash.replace(/^#/, "");
    const hashParams = new URLSearchParams(hash);
    const searchParams = new URLSearchParams(window.location.search);

    const hasAuthParams = ["access_token", "refresh_token", "token_hash", "type", "code"].some(
      (key) => hashParams.has(key) || searchParams.has(key)
    );

    if (!hasAuthParams) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setPageState("ready");
      } else {
        setPageState("no-token");
      }
      return;
    }

    const maxWait = 15000;
    const interval = 500;
    let elapsed = 0;

    const poll = async (): Promise<boolean> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) return true;
      elapsed += interval;
      if (elapsed >= maxWait) return false;
      await new Promise((r) => setTimeout(r, interval));
      return poll();
    };

    const success = await poll();
    if (success) {
      window.history.replaceState(null, "", window.location.pathname);
      setPageState("ready");
    } else {
      setPageState("error");
    }
  }, []);

  useEffect(() => {
    exchangeToken();
  }, [exchangeToken]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && pageState === "loading") {
        setPageState("ready");
      }
    });
    return () => subscription.unsubscribe();
  }, [pageState]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      const input = document.createElement("input");
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

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
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setSaving(false);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      // Mark password as set in profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ password_set: true }).eq("user_id", user.id);
      }
      setSaving(false);
      await supabase.auth.signOut();
      setPageState("done");
    }
  };

  // --- Loading ---
  if (pageState === "loading") {
    return (
      <AuthLayout>
        <Loader2 className="mb-5 h-8 w-8 animate-spin text-gold motion-reduce:animate-none" aria-hidden="true" />
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
          Verifying your link
        </h1>
        <p className="mt-2 text-sm text-bone-2">Hold on - confirming your reset link is valid.</p>
      </AuthLayout>
    );
  }

  // --- No token ---
  if (pageState === "no-token") {
    return (
      <AuthLayout>
        <Eyebrow className="mb-2 block">Reset link</Eyebrow>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
          Open in your browser
        </h1>
        <p className="mb-8 mt-2 text-sm text-bone-2">
          For this to work, open the link in Safari or Chrome. Email apps sometimes block it. Copy
          the link, then paste it into your browser's address bar.
        </p>
        <Button onClick={handleCopyLink} className="w-full" size="lg">
          {copied ? "Link copied" : "Copy link to clipboard"}
        </Button>
      </AuthLayout>
    );
  }

  // --- Error / expired ---
  if (pageState === "error") {
    return (
      <AuthLayout>
        <Eyebrow className="mb-2 block">Reset link</Eyebrow>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
          Link expired
        </h1>
        <p className="mb-8 mt-2 text-sm text-bone-2">
          This reset link has expired or is no longer valid. Request a fresh one and we'll send it
          straight over.
        </p>
        <Button
          variant="outline"
          className="w-full"
          size="lg"
          onClick={() => navigate("/forgot-password", { replace: true })}
        >
          Request a new link
        </Button>
      </AuthLayout>
    );
  }

  // --- Done ---
  if (pageState === "done") {
    return (
      <AuthLayout>
        <Eyebrow tone="gold" className="mb-2 block">
          All set
        </Eyebrow>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
          Password updated
        </h1>
        <p className="mb-8 mt-2 text-sm text-bone-2">Sign in with your new password to continue.</p>
        <Button
          className="w-full"
          size="lg"
          onClick={() => navigate("/login?message=Password+updated.+Sign+in+to+continue.", { replace: true })}
        >
          Go to sign in
        </Button>
      </AuthLayout>
    );
  }

  // --- Ready: password form ---
  return (
    <AuthLayout>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
        Reset your password
      </h1>
      <p className="mb-8 mt-2 text-sm text-bone-2">Enter your new password below.</p>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="reset-password">New password</Label>
          <Input
            id="reset-password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={10}
          />
          <PasswordStrengthMeter password={password} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reset-confirm">Confirm password</Label>
          <Input
            id="reset-confirm"
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
          disabled={saving || !evaluatePassword(password).meetsRequirements || password !== confirm}
        >
          {saving ? "Updating…" : "Update password"}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
