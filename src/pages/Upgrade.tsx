import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import lkIcon from "@/assets/lk-icon.png";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const benefits = [
  "Daily check-ins to build evidence of your freedom",
  "Urge redirection tools for in-the-moment pressure",
  "The Grace Protocol for post-relapse response",
  "Declarations and prayers to renew your mind daily",
  "Brotherhood connection with men walking the same path",
  "Progress tracking through the RAS Evidence Builder",
];

type PlanKey = "monthly" | "annual";

const CheckoutButton = ({ plan, amountLabel }: { plan: PlanKey; amountLabel: string }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const startCheckout = async () => {
    setSubmitting(true);
    setCheckoutUrl(null);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          planKey: plan,
          email: user?.email,
          returnUrl: window.location.origin,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("Could not open checkout");

      // Try to break out of the iframe (Lovable preview) and redirect the top window
      // to Stripe Checkout. If we can't access window.top (cross-origin) or it fails,
      // fall back to opening in a new tab, then to a clickable link.
      let redirected = false;
      try {
        if (window.top && window.top !== window.self) {
          window.top.location.href = data.url;
          redirected = true;
        } else {
          window.location.assign(data.url);
          redirected = true;
        }
      } catch {
        const popup = window.open(data.url, "_blank", "noopener,noreferrer");
        if (popup) {
          redirected = true;
        }
      }

      if (!redirected) {
        setCheckoutUrl(data.url);
        toast({ title: "Checkout ready", description: "Tap the checkout link below to continue." });
      }
      setSubmitting(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button type="button" onClick={startCheckout} size="xl" className="w-full" disabled={submitting}>
        {submitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>Continue to Pay {amountLabel}</>
        )}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        Secure payment via Stripe. Cancel anytime.
      </p>
      {checkoutUrl && (
        <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="block text-center text-sm text-primary underline">
          Open secure checkout
        </a>
      )}
    </div>
  );
};

const Upgrade = () => {
  const [plan, setPlan] = useState<PlanKey>("annual");
  const { signOut } = useAuth();

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
              <CheckoutButton plan={plan} amountLabel={amountLabel} />
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
