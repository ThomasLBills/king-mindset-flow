import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AuthLayout from "@/components/forge/AuthLayout";
import { Eyebrow } from "@/components/forge/atoms";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import { evaluatePassword } from "@/lib/passwordStrength";

const ChangePassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    if (password !== confirm) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      // Mark password as permanently set.
      await supabase
        .from("profiles")
        .update({ must_change_password: false, password_set: true } as any)
        .eq("user_id", user!.id);

      toast({ title: "Password updated", description: "Your new password has been set." });
      // Invalidate cache so guards pick up the new state
      queryClient.removeQueries({ queryKey: ["onboarding-check", user!.id] });
      // Navigate directly to onboarding (or app if already completed) to avoid guard race conditions
      const { data: freshProfile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user!.id)
        .single();
      navigate(freshProfile?.onboarding_completed ? "/app" : "/onboarding", { replace: true });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update password", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Eyebrow tone="gold" className="mb-2 block">
        One last step
      </Eyebrow>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
        Set your new password
      </h1>
      <p className="mb-8 mt-2 text-sm text-bone-2">
        You signed in with a temporary password. Choose your own to continue.
      </p>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
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
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <Input
            id="confirm-password"
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
          disabled={loading || !evaluatePassword(password).meetsRequirements || password !== confirm}
        >
          {loading ? "Setting password…" : "Set password"}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ChangePassword;
