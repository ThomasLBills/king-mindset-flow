import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlement } from "@/hooks/useEntitlement";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Billing = () => {
  const { user } = useAuth();
  const { isEntitled } = useEntitlement();
  const [portalLoading, setPortalLoading] = useState(false);
  const { toast } = useToast();

  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: stripeCustomer, isLoading: customerLoading } = useQuery({
    queryKey: ["stripe-customer", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("stripe_customers")
        .select("stripe_customer_id")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const hasStripeCustomer = !!stripeCustomer?.stripe_customer_id;

  const openBillingPortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-billing-portal", {
        body: { returnUrl: window.location.href },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-peace px-4 py-12">
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-serif text-3xl font-bold mb-6 text-center">Billing</h1>

          <Card className="card-elevated mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Subscription Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                {isEntitled ? (
                  <CheckCircle className="w-5 h-5 text-success" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
                <span className="font-medium">{isEntitled ? "Active" : "Inactive"}</span>
              </div>
              {subscription && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Status: <span className="capitalize">{subscription.status}</span>
                  </p>
                  {subscription.current_period_end && (
                    <p className="text-sm text-muted-foreground">
                      {subscription.cancel_at_period_end ? "Expires" : "Renews"}:{" "}
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

        <Button onClick={openBillingPortal} size="lg" className="w-full" disabled={portalLoading || customerLoading || !hasStripeCustomer}>
            {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Manage Billing <ExternalLink className="w-4 h-4" /></>}
          </Button>
          {!customerLoading && !hasStripeCustomer && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              No Stripe billing account is linked to your profile yet. Once you
              subscribe through checkout, you can manage your billing here. For
              help with an existing plan, contact hello@liberatedkings.com.
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Billing;
