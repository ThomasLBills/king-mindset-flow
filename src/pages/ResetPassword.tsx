import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import lkLogo from "@/assets/lk-logo-horizontal.png";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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
    setLoading(true);
    // Sign out first so we don't auto-navigate into the app
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      // Sign out so they have to sign in with their new password
      await supabase.auth.signOut();
      setDone(true);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <img src={lkLogo} alt="Liberated Kings" className="h-16 object-contain" />
          </div>
          <Card className="card-elevated border border-primary/40">
            <CardContent className="pt-8 text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-success mx-auto" />
              <p className="font-serif text-xl font-semibold">Password Updated</p>
              <p className="text-sm text-muted-foreground">Sign in to continue.</p>
              <Button onClick={() => navigate("/login?message=Password+updated.+Sign+in+to+continue.")} className="w-full" size="lg">
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src={lkLogo} alt="Liberated Kings" className="h-16 object-contain" />
        </div>
        <Card className="card-elevated border border-primary/40">
          <CardHeader className="text-center">
            <CardTitle className="font-serif text-2xl">Set New Password</CardTitle>
            <CardDescription>Choose a strong password for your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required minLength={6} />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="pl-10" required minLength={6} />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
