import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2, ArrowRight, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ThankYou = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [email, setEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [sendingLink, setSendingLink] = useState(false);
  const { user, signInWithMagicLink } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!sessionId) {
      setVerifying(false);
      return;
    }
    const verify = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-session", {
          body: { sessionId },
        });
        if (error) throw error;
        setVerified(data?.verified === true);
        if (data?.customerEmail) setEmail(data.customerEmail);
      } catch {
        // webhook may still be processing
      } finally {
        setVerifying(false);
      }
    };
    verify();
  }, [sessionId]);

  const handleSendMagicLink = async () => {
    if (!email) return;
    setSendingLink(true);
    const { error } = await signInWithMagicLink(email);
    setSendingLink(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setMagicLinkSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 gradient-peace">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="card-elevated">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            {verifying ? (
              <>
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                <p className="font-medium">Processing your payment…</p>
                <p className="text-sm text-muted-foreground">This may take a moment</p>
              </>
            ) : verified ? (
              <>
                <CheckCircle className="w-16 h-16 text-success mx-auto" />
                <h1 className="font-serif text-2xl font-bold">Welcome to the Brotherhood</h1>
                <p className="text-muted-foreground">Your access is ready.</p>

                {user ? (
                  <Button onClick={() => navigate("/app")} size="lg" className="w-full">
                    Go to Dashboard <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : magicLinkSent ? (
                  <div className="space-y-2">
                    <Mail className="w-8 h-8 text-primary mx-auto" />
                    <p className="text-sm">Login link sent to <strong>{email}</strong></p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Sign in to access your dashboard</p>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="text-center"
                    />
                    <Button onClick={handleSendMagicLink} size="lg" className="w-full" disabled={sendingLink || !email}>
                      {sendingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send me a login link"}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                <CheckCircle className="w-16 h-16 text-accent mx-auto" />
                <h1 className="font-serif text-2xl font-bold">Thank You!</h1>
                <p className="text-muted-foreground">
                  We're setting up your access. If this takes more than a minute, check your email for a login link.
                </p>
                <Button onClick={() => navigate("/login")} variant="outline" size="lg">
                  Go to Login
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ThankYou;
