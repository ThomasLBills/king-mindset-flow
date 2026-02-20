import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlement } from "@/hooks/useEntitlement";
import { Mail, Lock, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"magic" | "password">("magic");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signInWithMagicLink, signInWithPassword, user } = useAuth();
  const { isEntitled, isLoading: entitlementLoading } = useEntitlement();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in — useEffect to avoid render-time navigation
  useEffect(() => {
    if (!user) return;
    if (entitlementLoading) return;
    if (isEntitled) {
      navigate("/app", { replace: true });
    } else {
      navigate("/upgrade", { replace: true });
    }
  }, [user, isEntitled, entitlementLoading, navigate]);

  // Show spinner while waiting for auth + entitlement check
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signInWithMagicLink(email);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setMagicLinkSent(true);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signInWithPassword(email, password);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 gradient-peace">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="card-elevated">
          <CardHeader className="text-center">
            <CardTitle className="font-serif text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to continue your journey</CardDescription>
          </CardHeader>
          <CardContent>
            {magicLinkSent ? (
              <div className="text-center py-6 space-y-4">
                <CheckCircle className="w-12 h-12 text-success mx-auto" />
                <p className="font-medium">Check your email</p>
                <p className="text-sm text-muted-foreground">
                  We sent a login link to <strong>{email}</strong>
                </p>
                <Button variant="ghost" onClick={() => setMagicLinkSent(false)}>
                  Try again
                </Button>
              </div>
            ) : (
              <>
                {mode === "magic" ? (
                  <form onSubmit={handleMagicLink} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" size="lg" disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send Magic Link <ArrowRight className="w-4 h-4" /></>}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handlePassword} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required />
                    </div>
                    <Button type="submit" className="w-full" size="lg" disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
                    </Button>
                  </form>
                )}
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setMode(mode === "magic" ? "password" : "magic")}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {mode === "magic" ? "Use password instead" : "Use magic link instead"}
                  </button>
                </div>
                {mode === "password" && (
                  <div className="mt-2 text-center">
                    <button type="button" onClick={() => navigate("/forgot-password")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Forgot password?
                    </button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
