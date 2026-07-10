import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import AuthLayout from "@/components/forge/AuthLayout";
import { Eyebrow } from "@/components/forge/atoms";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

const ForgotPassword = () => {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onValid = async ({ email }: z.infer<typeof schema>) => {
    const normalized = email.trim().toLowerCase();

    try {
      // Check if user exists and whether they've set a password
      const { data } = await supabase.functions.invoke("check-user-eligible", {
        body: { email: normalized },
      });

      if (data?.eligible && data?.password_set === false) {
        // User hasn't set a password - send them a verification code
        // and redirect to the setup account page (the redirect is the confirmation)
        await supabase.functions.invoke("send-verification-code", {
          body: { email: normalized },
        });
        navigate("/setup-account");
        return;
      }
    } catch {
      // If check fails, fall through to normal reset
    }

    // Normal reset flow for users who have a password (or unknown users)
    const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      // Not field-specific (delivery/rate limit/unexpected) → toast.
      notify.fromError(error);
      return;
    }
    setSentTo(normalized);
  };

  if (sentTo) {
    return (
      <AuthLayout>
        <Eyebrow tone="gold" className="mb-2 block">
          Check your email
        </Eyebrow>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
          A way back in
        </h1>
        <p className="mb-8 mt-2 text-sm text-bone-2">
          We sent a reset link to <strong className="text-bone">{sentTo}</strong>. Open it on
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
          <SubmitButton
            className="w-full"
            size="lg"
            pending={form.formState.isSubmitting}
            pendingLabel="Sending…"
          >
            Send reset link
          </SubmitButton>
        </form>
      </Form>
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
