import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import AuthLayout from "@/components/forge/AuthLayout";

const schema = z.object({
  name: z.string().min(2, "Your name, brother"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});

const Signup = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onValid = async (values: z.infer<typeof schema>) => {
    const { error } = await signUp(
      values.email.trim().toLowerCase(),
      values.password,
      values.name.trim()
    );
    if (error) {
      toast.error(error.message);
      return;
    }
    // Depending on email-confirmation settings, signUp may or may not
    // establish a session immediately.
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      navigate("/app", { replace: true });
    } else {
      setAwaitingConfirmation(true);
    }
  };

  const submitting = form.formState.isSubmitting;

  if (awaitingConfirmation) {
    return (
      <AuthLayout>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
          Take your place
        </h1>
        <p className="mb-8 mt-2 text-sm text-bone-2">
          Check your email to confirm your account, then sign in.
        </p>
        <p className="text-sm text-dim">
          Already confirmed?{" "}
          <Link to="/login" className="text-gold underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
        Take your place
      </h1>
      <p className="mb-8 mt-2 text-sm text-bone-2">
        Every man here started with this step. You're in good company.
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onValid)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input autoComplete="name" placeholder="First and last name" {...field} />
                </FormControl>
                <FormDescription>Real names only. This is a brotherhood, not a forum.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
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
                  <Input type="password" autoComplete="new-password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </Form>
      <p className="mt-6 text-sm text-dim">
        Already a brother?{" "}
        <Link to="/login" className="text-gold underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Signup;
