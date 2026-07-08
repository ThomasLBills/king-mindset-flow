import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AuthLayout from "@/components/forge/AuthLayout";
import { Eyebrow } from "@/components/forge/atoms";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if user exists and whether they've set a password
      const { data } = await supabase.functions.invoke("check-user-eligible", {
        body: { email },
      });

      if (data?.eligible && data?.password_set === false) {
        // User hasn't set a password — send them a verification code
        // and redirect to the setup account page
        await supabase.functions.invoke("send-verification-code", {
          body: { email },
        });
        setLoading(false);
        navigate("/setup-account");
        return;
      }
    } catch {
      // If check fails, fall through to normal reset
    }

    // Normal reset flow for users who have a password (or unknown users)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }

    setLoading(false);
  };

  if (sent) {
    return (
      <AuthLayout>
        <Eyebrow tone="gold" className="mb-2 block">
          Check your email
        </Eyebrow>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
          A way back in
        </h1>
        <p className="mb-8 mt-2 text-sm text-bone-2">
          We sent a reset link to <strong className="text-bone">{email}</strong>. Open it on
          this device and you'll be back in the fight.
        </p>
        <Button variant="outline" className="w-full" size="lg" onClick={() => navigate("/login")}>
          Back to sign in
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
        Reset your password
      </h1>
      <p className="mb-8 mt-2 text-sm text-bone-2">
        It happens. Enter your email and we'll send a link to set a new one.
      </p>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <p className="mt-6 text-sm">
        <Link
          to="/login"
          className="text-dim underline-offset-4 transition-colors hover:text-bone-2 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default ForgotPassword;
