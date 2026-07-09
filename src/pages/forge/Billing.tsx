import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { AlertTriangle, ArrowLeft, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsImpersonating } from "@/contexts/ImpersonationContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Eyebrow, SectionCard } from "@/components/forge/atoms";

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
      "Stripe responded without a portal URL. This is usually temporary - please retry.",
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

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  trialing: "Trialing",
  past_due: "Past due",
  canceled: "Canceled",
};

const Billing = () => {
  const { user } = useAuth();
  const isImpersonating = useIsImpersonating();
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<PortalError | null>(null);

  const { data: subscription, isLoading: subLoading } = useQuery({
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
      toast.error("Disabled during impersonation", {
        description: "Exit impersonation to open the billing portal.",
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
      toast.error(ERROR_COPY[code].title, {
        description: err?.message ?? ERROR_COPY[code].description,
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const effectiveError: PortalError | null = portalError
    ? portalError
    : !customerLoading && !hasStripeCustomer && !!subscription
      ? { code: "no_stripe_customer", message: ERROR_COPY.no_stripe_customer.description }
      : null;

  const canRetry = !!portalError && portalError.code !== "no_stripe_customer";

  const statusLabel = subscription
    ? STATUS_LABEL[subscription.status] ?? subscription.status
    : null;
  const goodStanding =
    subscription?.status === "active" || subscription?.status === "trialing";

  const loading = !user || subLoading;

  return (
    <div className="mx-auto max-w-3xl px-5 py-7 sm:px-8">
      <Link
        to="/app/profile"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-dim transition-colors hover:text-bone-2"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Profile
      </Link>
      <header className="mb-6">
        <Eyebrow className="mb-1 block">Membership</Eyebrow>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
          Billing
        </h1>
      </header>

      {loading ? (
        <div className="flex flex-col gap-4" aria-busy="true">
          <div className="rounded-lg border border-line bg-raised p-5">
            <Skeleton className="mb-3 h-3 w-24" />
            <Skeleton className="mb-2 h-7 w-56" />
            <Skeleton className="mb-5 h-4 w-40" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ) : !subscription ? (
        <div className="flex flex-col gap-4">
          <SectionCard hatch className="p-5">
            <Eyebrow className="mb-1 block">Current plan</Eyebrow>
            <p className="font-display text-2xl font-bold tracking-tight text-bone">
              No subscription
            </p>
            <p className="mt-1 text-sm text-bone-2">
              There's no membership on this account yet. Join the brotherhood to unlock the full
              fight.
            </p>
            <Button asChild className="mt-5 w-full">
              <Link to="/upgrade">See membership options</Link>
            </Button>
          </SectionCard>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <SectionCard hatch className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Eyebrow className="mb-1 block">Current plan</Eyebrow>
                <p className="font-display text-2xl font-bold tracking-tight text-bone">
                  Brotherhood membership
                </p>
                {subscription.current_period_end && (
                  <p className="mt-1 text-sm text-bone-2">
                    {subscription.cancel_at_period_end ? "Expires" : "Renews"}{" "}
                    {format(new Date(subscription.current_period_end), "d MMMM yyyy")}
                  </p>
                )}
              </div>
              <Badge
                className={
                  goodStanding
                    ? "bg-gold text-primary-foreground hover:bg-gold"
                    : "bg-raised-2 text-bone-2 hover:bg-raised-2"
                }
              >
                {statusLabel}
              </Badge>
            </div>
            <div className="mt-5">
              <Button
                className="w-full"
                onClick={openBillingPortal}
                disabled={portalLoading || customerLoading || !hasStripeCustomer || isImpersonating}
              >
                {portalLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <>
                    Manage billing <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </Button>
              <p className="mt-2.5 text-center text-xs text-dim">
                Plan changes, cancellation, and your full invoice history all live in the secure
                Stripe billing portal.
              </p>
            </div>
          </SectionCard>

          {effectiveError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{ERROR_COPY[effectiveError.code].title}</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>{ERROR_COPY[effectiveError.code].description}</p>
                {effectiveError.message &&
                  effectiveError.message !== ERROR_COPY[effectiveError.code].description && (
                    <p className="text-xs opacity-80">Details: {effectiveError.message}</p>
                  )}
                {canRetry && (
                  <Button
                    onClick={openBillingPortal}
                    size="sm"
                    variant="outline"
                    disabled={portalLoading}
                  >
                    {portalLoading ? (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <RefreshCw className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    Retry
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          <p className="text-center text-xs text-dim">
            Honest pricing and a cancel button that works. That's the vow behind the vow.
          </p>
        </div>
      )}
    </div>
  );
};

export default Billing;
