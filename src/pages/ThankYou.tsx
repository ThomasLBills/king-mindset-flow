import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2, ArrowRight } from "lucide-react";
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
            ) : verified ? (
              <>
                <CheckCircle className="w-16 h-16 text-success mx-auto" />
                <h1 className="font-serif text-2xl font-bold">Welcome to the Brotherhood</h1>
                <p className="text-muted-foreground">Your access is ready.</p>
                <Button onClick={() => navigate(user ? "/app" : "/login")} size="lg" className="w-full">
                  {user ? "Go to Dashboard" : "Sign In"} <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <img src={lkIcon} alt="Liberated Kings" className="w-14 h-14 mx-auto" />
                <h1 className="font-serif text-2xl font-bold">Welcome to The Liberated Kings.</h1>
                <p className="text-muted-foreground">
                  Christ has secured your freedom. This app helps you walk in it daily. Sign in with your email and password to get started.
                </p>
                <Button onClick={() => navigate("/login")} size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  Enter the App <ArrowRight className="w-4 h-4" />
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
