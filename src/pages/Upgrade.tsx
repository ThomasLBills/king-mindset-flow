import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ArrowRight, Loader2, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const benefits = [
  "Daily check-ins to build evidence of your freedom",
  "Urge redirection tools for in-the-moment pressure",
  "The Grace Protocol for post-relapse response",
  "Randomized declarations and prayers to renew your mind daily",
  "Brotherhood connection with men walking the same path",
  "Progress tracking through the RAS Evidence Builder",
];

const Upgrade = () => {
  const [plan, setPlan] = useState<"monthly" | "annual">("annual");
  const [loading, setLoading] = useState(false);
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          planKey: plan,
          email: user?.email,
          returnUrl: window.location.origin,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-peace px-4 py-12">
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h1 className="font-serif text-3xl font-bold mb-2">Continue Walking in Your Freedom.</h1>
            <p className="text-muted-foreground">Keep your tools, brotherhood, and daily rhythm active.</p>
          </div>

          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setPlan("monthly")}
              className={`flex-1 p-4 rounded-xl border-2 transition-all text-left ${plan === "monthly" ? "border-primary bg-primary/5" : "border-border"}`}
            >
              <p className="font-semibold">Monthly</p>
              <p className="text-2xl font-bold font-serif">$29<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
            </button>
            <button
              onClick={() => setPlan("annual")}
              className={`flex-1 p-4 rounded-xl border-2 transition-all text-left relative ${plan === "annual" ? "border-primary bg-primary/5" : "border-border"}`}
            >
              <span className="absolute -top-2.5 right-3 bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full">Save 28%</span>
              <p className="font-semibold">Annual</p>
              <p className="text-2xl font-bold font-serif">$21<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
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

          <Button onClick={handleCheckout} size="xl" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Subscribe Now <ArrowRight className="w-5 h-5" /></>}
          </Button>

          <button onClick={signOut} className="block mx-auto mt-4 text-sm text-muted-foreground hover:text-foreground">
            Sign out
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Upgrade;
