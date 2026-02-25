import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2, ArrowRight, MailOpen } from "lucide-react";
import lkIcon from "@/assets/lk-icon.png";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const ThankYou = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

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
      } catch {
        // webhook may still be processing
      } finally {
        setVerifying(false);
      }
    };
    verify();
  }, [sessionId]);

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
            ) : verified && user ? (
              <>
                <CheckCircle className="w-16 h-16 text-success mx-auto" />
                <h1 className="font-serif text-2xl font-bold">Welcome to the Brotherhood</h1>
                <p className="text-muted-foreground">Your access is ready.</p>
                <Button onClick={() => navigate("/app")} size="lg" className="w-full">
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <MailOpen className="w-16 h-16 text-primary mx-auto" />
                <h1 className="font-serif text-2xl font-bold">Welcome to The Liberated Kings</h1>
                <p className="text-muted-foreground">
                  Check your email for a link to create your password and access the app.
                </p>
                <p className="text-sm text-muted-foreground">
                  Don't see it? Check your spam folder. The email will come from a noreply address.
                </p>
                <Button variant="outline" onClick={() => navigate("/login")} size="lg" className="w-full">
                  Already set your password? Sign In <ArrowRight className="w-4 h-4" />
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