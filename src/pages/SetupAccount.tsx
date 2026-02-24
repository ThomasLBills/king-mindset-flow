import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Loader2, ArrowRight, AlertTriangle, Copy, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import lkLogo from "@/assets/lk-logo-horizontal.png";

type PageState = "loading" | "no-token" | "error" | "ready";

const SetupAccount = () => {
  const [pageState, setPageState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const exchangeToken = useCallback(async () => {
    const hash = window.location.hash.replace(/^#/, "");
    const hashParams = new URLSearchParams(hash);
    const searchParams = new URLSearchParams(window.location.search);

    // Check if auth params exist in either hash or query
    const hasAuthParams = ["access_token", "refresh_token", "token_hash", "type", "code"].some(
      (key) => hashParams.has(key) || searchParams.has(key)
    );

    if (!hasAuthParams) {
      // No params visible — but mobile browsers may have already handed them to the
      // Supabase client before JS ran, or the client is still exchanging in the
      // background.  Poll briefly before concluding the token is truly missing.
      const shortPoll = async (): Promise<boolean> => {
        const attempts = 6; // 3 seconds total
        for (let i = 0; i < attempts; i++) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) return true;
          await new Promise((r) => setTimeout(r, 500));
        }
        return false;
      };

      const found = await shortPoll();
      setPageState(found ? "ready" : "no-token");
      return;
    }

    // Wait for the auth state change listener to process the token
    // The Supabase client automatically exchanges tokens from the URL
    // We just need to wait for it to settle
    const maxWait = 15000;
    const interval = 500;
    let elapsed = 0;

    const poll = async (): Promise<boolean> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) return true;
      elapsed += interval;
      if (elapsed >= maxWait) return false;
      await new Promise((r) => setTimeout(r, interval));
      return poll();
    };

    const success = await poll();
    if (success) {
      // Clean up hash/query so it doesn't re-trigger
      window.history.replaceState(null, "", window.location.pathname);
      setPageState("ready");
    } else {
      setPageState("error");
    }
  }, []);

  useEffect(() => {
    exchangeToken();
  }, [exchangeToken]);

  // Also listen for auth state changes in case token exchange happens after initial check
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && pageState === "loading") {
        setPageState("ready");
      }
    });
    return () => subscription.unsubscribe();
  }, [pageState]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Must be at least 6 characters.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      navigate("/app", { replace: true });
    }
  };

  // --- Loading state ---
  if (pageState === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md text-center">
          <div className="flex justify-center mb-8">
            <img src={lkLogo} alt="Liberated Kings" className="h-16 object-contain" />
          </div>
          <Card className="card-elevated border border-primary/40">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
              <p className="font-serif text-xl font-semibold">Setting up your account...</p>
              <p className="text-sm text-muted-foreground">Please wait while we verify your invite link.</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // --- No token / in-app browser state ---
  if (pageState === "no-token") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <img src={lkLogo} alt="Liberated Kings" className="h-16 object-contain" />
          </div>
          <Card className="card-elevated border border-primary/40">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-primary mx-auto" />
              <p className="font-serif text-xl font-semibold">Open in Your Browser</p>
              <p className="text-sm text-muted-foreground">
                For the best experience, please open this link in Safari or Chrome. Email apps can sometimes prevent the link from working properly.
              </p>
              <Button onClick={handleCopyLink} className="w-full" size="lg">
                {copied ? (
                  <><CheckCircle className="w-4 h-4 mr-2" /> Link Copied!</>
                ) : (
                  <><Copy className="w-4 h-4 mr-2" /> Copy Link to Clipboard</>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                After copying, open Safari or Chrome and paste the link in the address bar.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // --- Error / expired token state ---
  if (pageState === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <img src={lkLogo} alt="Liberated Kings" className="h-16 object-contain" />
          </div>
          <Card className="card-elevated border border-primary/40">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
              <p className="font-serif text-xl font-semibold">Link Expired</p>
              <p className="text-sm text-muted-foreground">
                This invite link has expired or is no longer valid. Please contact your admin for a new one.
              </p>
              <Button variant="outline" onClick={() => navigate("/login", { replace: true })} className="w-full" size="lg">
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // --- Ready: show password form ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src={lkLogo} alt="Liberated Kings" className="h-16 object-contain" />
        </div>
        <Card className="card-elevated border border-primary/40">
          <CardHeader className="text-center">
            <CardTitle className="font-serif text-2xl">Create Your Password</CardTitle>
            <CardDescription>Choose a strong password for your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SetupAccount;
