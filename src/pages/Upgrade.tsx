import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import lkIcon from "@/assets/lk-icon.png";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useQueryClient } from "@tanstack/react-query";

const STRIPE_PUBLISHABLE_KEY =
  "pk_live_51T2kS2EBAqZ3z3Wsdh3GFpzGhv5He53w0pHYxf07Q2GXWPqFtbCR10PeLhzvCxABkRmgvN7uIcJTMBNIngcbFF6X00noRfeHgT";

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const benefits = [
  "Daily check-ins to build evidence of your freedom",
  "Urge redirection tools for in-the-moment pressure",
  "The Grace Protocol for post-relapse response",
  "Declarations and prayers to renew your mind daily",
  "Brotherhood connection with men walking the same path",
  "Progress tracking through the RAS Evidence Builder",
];

type PlanKey = "monthly" | "annual";

const PaymentForm = ({ plan, amountLabel }: { plan: PlanKey; amountLabel: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const waitForEntitlement = async (): Promise<boolean> => {
    if (!user) return false;
    for (let i = 0; i < 15; i++) {
      const { data } = await supabase
        .from("entitlements")
        .select("active, expires_at")
        .eq("user_id", user.id)
        .eq("entitlement_type", "course_app_access")
        .eq("active", true)
        .maybeSingle();
      if (data && (!data.expires_at || new Date(data.expires_at) > new Date())) {
        return true;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    try {
      const { error: submitErr } = await elements.submit();
      if (submitErr) {
        toast({ title: "Payment error", description: submitErr.message, variant: "destructive" });
        setSubmitting(false);
        return;
      }

      const { error } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: {
          return_url: `${window.location.origin}/app`,
        },
      });

      if (error) {
        toast({ title: "Payment failed", description: error.message, variant: "destructive" });
        setSubmitting(false);
        return;
      }

      // Payment succeeded — wait for webhook to grant entitlement
      const granted = await waitForEntitlement();
      await queryClient.invalidateQueries({ queryKey: ["entitlement"] });

      if (granted) {
        toast({ title: "Welcome", description: "Your access is active." });
      } else {
        toast({
          title: "Payment received",
          description: "Activating your access — this may take a moment.",
        });
      }
      navigate("/app", { replace: true });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      <Button type="submit" size="xl" className="w-full" disabled={!stripe || submitting}>
        {submitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>Pay {amountLabel}</>
        )}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        Secure payment via Stripe. Cancel anytime.
      </p>
    </form>
  );
};

const Upgrade = () => {
  const [plan, setPlan] = useState<PlanKey>("annual");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [initLoading, setInitLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const { signOut } = useAuth();
  const { toast } = useToast();

  // Whenever the plan changes, create a fresh subscription + PaymentIntent.
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setInitLoading(true);
      setInitError(null);
      setClientSecret(null);
      try {
        const { data, error } = await supabase.functions.invoke("create-payment-intent", {
          body: { planKey: plan },
        });
        if (cancelled) return;
        if (error) throw error;
        if (!data?.clientSecret) throw new Error("Could not initialize payment");
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        if (cancelled) return;
        const msg = err?.message || "Failed to initialize payment";
        setInitError(msg);
        toast({ title: "Error", description: msg, variant: "destructive" });
      } finally {
        if (!cancelled) setInitLoading(false);
      }
    };
    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  const elementsOptions = useMemo(
    () =>
      clientSecret
        ? {
            clientSecret,
            appearance: {
              theme: "night" as const,
              variables: {
                colorPrimary: "#B8963F",
                colorBackground: "#1A1A1A",
                colorText: "#F5F3EE",
                colorDanger: "#ef4444",
                fontFamily: "Inter, system-ui, sans-serif",
                borderRadius: "8px",
              },
            },
          }
        : undefined,
    [clientSecret]
  );

  const amountLabel = plan === "monthly" ? "$7.95/mo" : "$69.95/yr";

  return (
    <div className="min-h-screen gradient-peace px-4 py-12">
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <img src={lkIcon} alt="Liberated Kings" className="w-14 h-14 mx-auto mb-4" />
            <h1 className="font-serif text-3xl font-bold mb-2">Continue Walking in Your Freedom.</h1>
            <p className="text-muted-foreground">Keep your tools, brotherhood, and daily rhythm active.</p>
          </div>

          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setPlan("monthly")}
              className={`flex-1 p-4 rounded-xl border-2 transition-all text-left ${plan === "monthly" ? "border-primary bg-primary/5" : "border-border"}`}
            >
              <p className="font-semibold">Monthly</p>
              <p className="text-2xl font-bold font-serif">
                $7.95<span className="text-sm font-normal text-muted-foreground">/mo</span>
              </p>
            </button>
            <button
              onClick={() => setPlan("annual")}
              className={`flex-1 p-4 rounded-xl border-2 transition-all text-left relative ${plan === "annual" ? "border-primary bg-primary/5" : "border-border"}`}
            >
              <span className="absolute -top-2.5 right-3 bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                Save 27%
              </span>
              <p className="font-semibold">Annual</p>
              <p className="text-2xl font-bold font-serif">
                $5.83<span className="text-sm font-normal text-muted-foreground">/mo</span>
              </p>
              <p className="text-xs text-muted-foreground">$69.95 billed annually</p>
            </button>
          </div>

          <Card className="card-elevated mb-6">
            <CardContent className="pt-6">
              <ul className="space-y-2.5">
                {benefits.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="card-elevated mb-4">
            <CardContent className="pt-6">
              {initLoading || !clientSecret ? (
                <div className="flex items-center justify-center py-12">
                  {initError ? (
                    <p className="text-sm text-destructive text-center">{initError}</p>
                  ) : (
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  )}
                </div>
              ) : (
                <Elements key={clientSecret} stripe={stripePromise} options={elementsOptions}>
                  <PaymentForm plan={plan} amountLabel={amountLabel} />
                </Elements>
              )}
            </CardContent>
          </Card>

          <button onClick={signOut} className="block mx-auto mt-4 text-sm text-muted-foreground hover:text-foreground">
            Sign out
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Upgrade;
