import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Check, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const benefits = [
"Daily check-ins to build evidence of your freedom",
"Urge redirection tools for in-the-moment pressure",
"The Grace Protocol for post-relapse response",
"Randomized declarations and prayers to renew your mind daily",
"Brotherhood connection with men walking the same path",
"Progress tracking through the RAS Evidence Builder"];


const Checkout = () => {
  const [plan, setPlan] = useState<"monthly" | "annual">("annual");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const canceled = searchParams.get("canceled") === "true";
  const { user } = useAuth();
  const { toast } = useToast();

  const monthlyPrice = 9.95;
  const annualPrice = 84.95;
  const annualMonthly = 7.08;
  const savingsPercent = 29;

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          planKey: plan,
          email: user?.email || email,
          returnUrl: window.location.origin
        }
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to create checkout session", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-peace px-4 py-12">
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {canceled &&
          <div className="mb-6 p-4 rounded-xl bg-warning/10 border border-warning/30 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-warning shrink-0" />
              <p className="text-sm">Checkout was canceled. You can try again anytime.</p>
            </div>
          }

          <div className="text-center mb-8">
            <h1 className="font-serif font-bold mb-2 text-2xl">Continue Walking in Your Freedom</h1>
            <p className="text-muted-foreground">Created to equip you for every step. You are already free in Christ.



            </p>
          </div>

          {/* Plan Toggle */}
          <div className="flex gap-3 mb-6">
            <button onClick={() => setPlan("monthly")} className={`flex-1 p-4 rounded-xl border-2 transition-all text-left ${plan === "monthly" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>

              <p className="font-semibold">Monthly</p>
              <p className="text-2xl font-bold font-serif">${monthlyPrice}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
            </button>
            <button
              onClick={() => setPlan("annual")}
              className={`flex-1 p-4 rounded-xl border-2 transition-all text-left relative ${
              plan === "annual" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`
              }>

              <span className="absolute -top-2.5 right-3 bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                Save {savingsPercent}%
              </span>
              <p className="font-semibold">Annual</p>
              <p className="text-2xl font-bold font-serif">${annualMonthly}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              <p className="text-xs text-muted-foreground">${annualPrice} billed annually</p>
            </button>
          </div>

          {/* Benefits */}
          <Card className="card-elevated mb-6">
            <CardContent className="pt-6">
              <p className="font-semibold mb-3">Everything included:</p>
              <ul className="space-y-2.5">
                {benefits.map((b) =>
                <li key={b} className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {b}
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>

          {/* Email if not logged in */}
          {!user &&
          <div className="mb-4">
              <Input
              type="email"
              placeholder="Enter your email to get started"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-center" />

            </div>
          }

          <Button onClick={handleCheckout} size="xl" className="w-full" disabled={loading || !user && !email}>
            {loading ?
            <Loader2 className="w-5 h-5 animate-spin" /> :

            <>
                Get Started — ${plan === "monthly" ? monthlyPrice : annualPrice}/{plan === "monthly" ? "mo" : "yr"}
                <ArrowRight className="w-5 h-5" />
              </>
            }
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Cancel anytime. Secure payment via Stripe.
          </p>
        </motion.div>
      </div>
    </div>);

};

export default Checkout;