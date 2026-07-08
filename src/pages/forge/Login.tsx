import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useMockAuth } from "@/mock/auth";
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
  const { signIn } = useMockAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  // Testing mode: submit signs in with whatever was typed, validation skipped.
  // To restore validation, route this through form.handleSubmit(onValid).
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn(form.getValues("email").trim() || "tester@liberatedkings.com");
    navigate(from ?? "/app", { replace: true });
  };

  return (
    <AuthLayout>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
        Welcome back
      </h1>
      <p className="mb-8 mt-2 text-sm text-bone-2">Pick up where you left off, brother.</p>
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
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
          <Button type="submit" className="w-full" size="lg">
            Sign in
          </Button>
        </form>
      </Form>
      <div className="mt-6 flex items-center justify-between text-sm">
        <button
          className="text-dim underline-offset-4 transition-colors hover:text-bone-2 hover:underline"
          onClick={() => toast.info("Reset link sent. Check your email. (Demo: any password works.)")}
        >
          Forgot password?
        </button>
        <Link to="/signup" className="text-gold underline-offset-4 hover:underline">
          New here? Join
        </Link>
      </div>
    </AuthLayout>
  );
};

export default Login;
