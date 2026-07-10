import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { notify } from "@/lib/notify";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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
import AuthLayout from "@/components/forge/AuthLayout";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});

const Login = () => {
  const { signInWithPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onValid = async (values: z.infer<typeof schema>) => {
    form.clearErrors("root");
    const email = values.email.trim().toLowerCase();
    const { error } = await signInWithPassword(email, values.password);
    if (!error) {
      navigate(from ?? "/app", { replace: true });
      return;
    }
    // Check if this user exists but hasn't set a password yet
    try {
      const { data } = await supabase.functions.invoke("check-user-eligible", {
        body: { email },
      });
      if (data?.eligible && data?.password_set === false) {
        // check-user-eligible already sent a code; the redirect is the confirmation
        navigate("/setup-account");
        return;
      }
    } catch {
      // Ignore - fall through to normal error
    }
    // Credential mismatch is field-level → show it inline (form-level), not as a toast.
    if (/invalid login credentials|invalid credentials|email or password/i.test(error.message)) {
      form.setError("root", {
        message: "That email and password don't match. Check them and try again.",
      });
      return;
    }
    // Non-field failures (network, rate limit, unexpected) → toast.
    if (/load failed|failed to fetch|network/i.test(error.message)) {
      notify.error("Connection failed. Please refresh and try again.");
      return;
    }
    notify.error(error.message);
  };

  const submitting = form.formState.isSubmitting;

  return (
    <AuthLayout>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
        Welcome back
      </h1>
      <p className="mb-8 mt-2 text-sm text-bone-2">Pick up where you left off, brother.</p>
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
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="current-password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <SubmitButton className="w-full" size="lg" pending={submitting} pendingLabel="Signing in…">
            Sign in
          </SubmitButton>
        </form>
      </Form>
      <div className="mt-6 flex items-center justify-between text-sm">
        <Link
          to="/forgot-password"
          className="text-dim underline-offset-4 transition-colors hover:text-bone-2 hover:underline"
        >
          Forgot password?
        </Link>
        <Link to="/signup" className="text-gold underline-offset-4 hover:underline">
          New here? Join
        </Link>
      </div>
      <p className="mt-3 text-sm">
        <Link
          to="/setup-account"
          className="text-dim underline-offset-4 transition-colors hover:text-bone-2 hover:underline"
        >
          Bought the course? Set up your account
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
