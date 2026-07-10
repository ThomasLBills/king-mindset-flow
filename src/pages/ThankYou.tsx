import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Eyebrow } from "@/components/forge/atoms";
import { LkSeal, LkMonogram } from "@/components/forge/brand";
import { Grain } from "@/components/forge/scenes";

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
    <div className="lk-cream relative grid min-h-dvh place-items-center overflow-hidden bg-background px-6 py-12 text-foreground">
      <Grain />

      <div className="relative w-full max-w-md text-center">
        {verifying ? (
          <>
            <Loader2 className="mx-auto mb-6 h-9 w-9 animate-spin text-gold motion-reduce:animate-none" aria-hidden="true" />
            <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-bone">
              Processing your payment
            </h1>
            <p className="mt-2 text-sm text-bone-2">This takes just a moment.</p>
          </>
        ) : verified && user ? (
          <>
            <LkSeal className="mx-auto mb-6 h-20 w-20 text-gold opacity-90" />
            <Eyebrow tone="gold" className="mb-2 block">
              You're in
            </Eyebrow>
            <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
              Welcome to the brotherhood
            </h1>
            <p className="mt-3 font-serif text-lg italic text-bone-2">
              Your place is ready. You don't fight alone anymore.
            </p>
            <Button onClick={() => navigate("/app")} size="lg" className="mt-8 w-full">
              Enter the app
            </Button>
          </>
        ) : (
          <>
            <LkMonogram tone="ink" className="mx-auto mb-6 h-12 w-16" />
            <Eyebrow tone="gold" className="mb-2 block">
              Almost there
            </Eyebrow>
            <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
              Welcome to Liberated Kings
            </h1>
            <p className="mt-3 text-sm text-bone-2">
              Check your email for a link to create your password and open the app.
            </p>
            <p className="mt-2 text-xs text-dim">
              Don't see it? Check your spam folder. It comes from a noreply address.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate("/login")}
              size="lg"
              className="mt-8 w-full"
            >
              Already set your password? Sign in
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ThankYou;
