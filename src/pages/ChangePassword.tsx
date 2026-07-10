import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { notify } from "@/lib/notify";
import AuthLayout from "@/components/forge/AuthLayout";
import { Eyebrow } from "@/components/forge/atoms";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import { evaluatePassword } from "@/lib/passwordStrength";

const schema = z
  .object({
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

const ChangePassword = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });
  const password = form.watch("password");

  const onValid = async ({ password: newPassword }: z.infer<typeof schema>) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      // Not field-specific → toast.
      notify.fromError(error);
      return;
    }

    // Mark password as permanently set.
    await supabase
      .from("profiles")
      .update({ must_change_password: false, password_set: true } as never)
      .eq("user_id", user!.id);

    // Invalidate cache so guards pick up the new state
    queryClient.removeQueries({ queryKey: ["onboarding-check", user!.id] });
    // Navigate directly to onboarding (or app if already completed) to avoid guard race
    // conditions. The redirect is the confirmation.
    const { data: freshProfile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("user_id", user!.id)
      .single();
    navigate(freshProfile?.onboarding_completed ? "/app" : "/onboarding", { replace: true });
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onValid)} className="space-y-5" noValidate>
          <FormErrorSummary errors={form.formState.errors} submitCount={form.formState.submitCount} />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
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
                <FormLabel>Confirm new password</FormLabel>
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
            pendingLabel="Setting password…"
          >
            Set password
          </SubmitButton>
        </form>
      </Form>
    </AuthLayout>
  );
};

export default ChangePassword;
