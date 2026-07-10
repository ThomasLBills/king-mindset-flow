import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FormErrorSummary } from "@/components/form/FormErrorSummary";
import { SubmitButton } from "@/components/form/SubmitButton";
import { supabase } from "@/integrations/supabase/client";
import { notify } from "@/lib/notify";
import { useAuth } from "@/hooks/useAuth";
import AuthLayout from "@/components/forge/AuthLayout";
import { Eyebrow } from "@/components/forge/atoms";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import { evaluatePassword } from "@/lib/passwordStrength";

const emailSchema = z.string().email();

const schema = z
  .object({
    email: z.string().email("Enter a valid email"),
    code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code from your email"),
    password: z
      .string()
      .refine((v) => evaluatePassword(v).meetsRequirements, {
        message: "Use 10+ characters with an uppercase letter, a number, and a symbol (like #).",
      }),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match.",
    path: ["confirm"],
  });

const SetupAccount = () => {
  const [expired, setExpired] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const { signInWithPassword } = useAuth();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", code: "", password: "", confirm: "" },
  });
  const password = form.watch("password");

  const onValid = async ({ email, code, password: newPassword }: z.infer<typeof schema>) => {
    const { data, error } = await supabase.functions.invoke("verify-code-set-password", {
      body: { email: email.trim(), code: code.trim(), password: newPassword },
    });

    // Invocation / network failure → not field-specific → toast.
    if (error) {
      notify.fromError(error);
      return;
    }
    if (!data?.success) {
      const errMsg = data?.error || "Something went wrong";
      if (errMsg === "expired") {
        setExpired(true);
        return;
      }
      // Verification failure is code-field-specific → show it inline.
      form.setError("code", { message: "That code isn't valid. Check it and try again." });
      return;
    }

    // Password set successfully - sign in automatically
    const { error: signInError } = await signInWithPassword(email.trim(), newPassword);
    if (signInError) {
      // Auto sign-in failed; the redirect lands on /login, so signal why with a toast.
      notify.success("Password created. Sign in with your new password.");
      navigate("/login", { replace: true });
    } else {
      navigate("/app", { replace: true });
    }
  };

  const handleResendCode = async () => {
    const email = form.getValues("email").trim();
    if (!emailSchema.safeParse(email).success) {
      form.setError("email", { message: "Enter your email first" });
      return;
    }
    setResending(true);
    const { error } = await supabase.functions.invoke("send-verification-code", {
      body: { email },
    });
    setResending(false);
    if (error) {
      notify.fromError(error);
      return;
    }
    form.setValue("code", "");
    setExpired(false);
    notify.success("New code sent. Check your email for a fresh verification code.");
  };

  // --- Expired code state ---
  if (expired) {
    return (
      <AuthLayout>
        <Eyebrow className="mb-2 block">Verification</Eyebrow>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
          Code expired
        </h1>
        <p className="mb-8 mt-2 text-sm text-bone-2">
          That code timed out - they don't last long, on purpose. Send yourself a fresh one.
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onValid)} className="space-y-5" noValidate>
          <FormErrorSummary errors={form.formState.errors} submitCount={form.formState.submitCount} />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Verification code</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="000000"
                    className="text-center font-mono text-lg tracking-[0.4em]"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    {...field}
                  />
                </FormControl>
                <PasswordStrengthMeter password={password} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <SubmitButton
            className="w-full"
            size="lg"
            pending={form.formState.isSubmitting}
            pendingLabel="Creating account…"
          >
            Create account
          </SubmitButton>
        </form>
      </Form>
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
