import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlement } from "@/hooks/useEntitlement";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useIsImpersonating } from "@/contexts/ImpersonationContext";

type PortalErrorCode =
  | "no_stripe_customer"
  | "portal_not_configured"
  | "stripe_error"
  | "missing_portal_url"
  | "server_error"
  | "network_error"
  | "unauthorized";

type PortalError = { code: PortalErrorCode; message: string };

const ERROR_COPY: Record<PortalErrorCode, { title: string; description: string }> = {
  no_stripe_customer: {
    title: "No Stripe billing account linked",
    description:
      "Your access was provisioned without a Stripe subscription, so there's nothing to manage in the billing portal. If you believe this is a mistake, contact hello@liberatedkings.com.",
  },
  portal_not_configured: {
    title: "Billing portal not configured",
    description:
      "Stripe hasn't finished configuring the customer portal for this account yet. Please try again shortly or contact hello@liberatedkings.com if the issue persists.",
  },
  missing_portal_url: {
    title: "Missing portal link",
    description:
      "Stripe responded without a portal URL. This is usually temporary — please retry.",
  },
  stripe_error: {
    title: "Stripe returned an error",
    description:
      "We couldn't open the billing portal. Retry, and if it keeps failing, contact hello@liberatedkings.com.",
  },
  server_error: {
    title: "Server error",
    description: "Something went wrong on our side. Please retry in a moment.",
  },
  network_error: {
    title: "Network issue",
    description:
      "We couldn't reach the billing service. Check your connection and try again.",
  },
  unauthorized: {
    title: "Session expired",
    description: "Please sign in again to manage your billing.",
  },
};

const Billing = () => {
  const { user } = useAuth();
  const { isEntitled } = useEntitlement();
  const isImpersonating = useIsImpersonating();
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<PortalError | null>(null);
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
    if (isImpersonating) {
      toast({
        title: "Disabled during impersonation",
        description: "Exit impersonation to open the billing portal.",
        variant: "destructive",
      });
      return;
    }
    setPortalLoading(true);
    setPortalError(null);
    try {
      const { data, error } = await supabase.functions.invoke<{
        url?: string;
        error?: string;
        code?: PortalErrorCode;
      }>("create-billing-portal", {
        body: { returnUrl: window.location.href },
      });

      if (error) {
        // FunctionsHttpError: server responded with non-2xx; body is in `data`
        const code = (data?.code as PortalErrorCode | undefined) ??
          (error.name === "FunctionsFetchError" ? "network_error" : "server_error");
        const message = data?.error ?? error.message;
        setPortalError({ code, message });
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      setPortalError({
        code: "missing_portal_url",
        message: "No portal URL returned.",
      });
    } catch (err: any) {
      const code: PortalErrorCode =
        err?.name === "TypeError" || err?.message?.includes("fetch")
          ? "network_error"
          : "server_error";
      setPortalError({ code, message: err?.message ?? "Unexpected error" });
      toast({
        title: ERROR_COPY[code].title,
        description: err?.message ?? ERROR_COPY[code].description,
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const effectiveError: PortalError | null = portalError
    ? portalError
    : !customerLoading && !hasStripeCustomer
      ? { code: "no_stripe_customer", message: ERROR_COPY.no_stripe_customer.description }
      : null;

  const canRetry = !!portalError && portalError.code !== "no_stripe_customer";

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

          <Button
            onClick={openBillingPortal}
            size="lg"
            className="w-full"
            disabled={portalLoading || customerLoading || !hasStripeCustomer}
          >
            {portalLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Manage Billing <ExternalLink className="w-4 h-4" />
              </>
            )}
          </Button>

          {effectiveError && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{ERROR_COPY[effectiveError.code].title}</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>{ERROR_COPY[effectiveError.code].description}</p>
                {effectiveError.message &&
                  effectiveError.message !== ERROR_COPY[effectiveError.code].description && (
                    <p className="text-xs opacity-80">
                      Details: {effectiveError.message}
                    </p>
                  )}
                {canRetry && (
                  <Button
                    onClick={openBillingPortal}
                    size="sm"
                    variant="outline"
                    disabled={portalLoading}
                  >
                    {portalLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 mr-2" />
                    )}
                    Retry
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Billing;
