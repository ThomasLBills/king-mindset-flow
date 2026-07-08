import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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
        // check-user-eligible already sent a code
        navigate("/setup-account");
        return;
      }
    } catch {
      // Ignore — fall through to normal error
    }
    const message = /load failed|failed to fetch|network/i.test(error.message)
      ? "Connection failed. Please refresh and try again."
      : error.message;
    toast.error(message);
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
          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
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
