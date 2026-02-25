import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import lkLogo from "@/assets/lk-logo-horizontal.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if user exists and whether they've set a password
      const { data } = await supabase.functions.invoke("check-user-eligible", {
        body: { email },
      });

      if (data?.eligible && data?.password_set === false) {
        // User hasn't set a password — send them a verification code
        // and redirect to the setup account page
        await supabase.functions.invoke("send-verification-code", {
          body: { email },
        });
        setLoading(false);
        navigate("/setup-account");
        return;
      }
    } catch {
      // If check fails, fall through to normal reset
    }

    // Normal reset flow for users who have a password (or unknown users)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src={lkLogo} alt="Liberated Kings" className="h-16 object-contain" />
        </div>
        <Card className="card-elevated border border-primary/40">
          <CardHeader className="text-center">
            <CardTitle className="font-serif text-2xl">Reset Password</CardTitle>
            <CardDescription>We'll send you a link to reset your password</CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center py-6 space-y-4">
                <CheckCircle className="w-12 h-12 text-success mx-auto" />
                <p className="font-medium">Check your email</p>
                <p className="text-sm text-muted-foreground">
                  We sent a link to <strong>{email}</strong> to help you access your account.
                </p>
                <Button variant="ghost" onClick={() => navigate("/login")}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to login
                </Button>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
                  </Button>
                </form>
                <div className="mt-4 text-center">
                  <button type="button" onClick={() => navigate("/login")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-3 h-3 inline mr-1" /> Back to login
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
