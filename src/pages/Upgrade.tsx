import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { notify } from "@/lib/notify";
import { Eyebrow, SectionCard } from "@/components/forge/atoms";
import { LkMonogram } from "@/components/forge/brand";
import { Grain } from "@/components/forge/scenes";

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
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const startCheckout = async () => {
    setSubmitting(true);
    setCheckoutUrl(null);

    // CRITICAL for mobile (iOS Safari, Android Chrome):
    // Browsers block window.open / top-level navigation that happens AFTER an
    // async await unless it's tied to a user gesture. Open a placeholder tab
    // synchronously here, then navigate it once we have the Checkout URL.
    let popup: Window | null = null;
    try {
      popup = window.open("about:blank", "_blank");
    } catch {
      popup = null;
    }

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          planKey: plan,
          email: user?.email,
          returnUrl: window.location.origin,
        },
      });

      if (error) throw error;
      if (!data?.url) {
        if (popup) popup.close();
        throw new Error("Could not open checkout");
      }

      let redirected = false;

      // Preferred path on mobile: navigate the tab we opened synchronously.
      if (popup && !popup.closed) {
        try {
          popup.location.href = data.url;
          redirected = true;
        } catch {
          // ignore - fall through to other strategies
        }
      }

      // Try to break out of the iframe (Lovable preview) and redirect the top window.
      if (!redirected) {
        try {
          if (window.top && window.top !== window.self) {
            window.top.location.href = data.url;
            redirected = true;
          } else {
            window.location.assign(data.url);
            redirected = true;
          }
        } catch {
          // ignore
        }
      }

      if (!redirected) {
        setCheckoutUrl(data.url);
        notify.info("Checkout ready", { description: "Tap the checkout link below to continue." });
      }
      setSubmitting(false);
    } catch (err: any) {
      if (popup && !popup.closed) popup.close();
      notify.error(err?.message ?? "Couldn't open checkout. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button type="button" onClick={startCheckout} size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Opening checkout…" : `Continue to pay ${amountLabel}`}
      </Button>
      <p className="text-center text-xs text-dim">Secure payment via Stripe. Cancel anytime.</p>
      {checkoutUrl && (
        <a
          href={checkoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-sm text-gold underline underline-offset-4"
        >
          Open secure checkout
        </a>
      )}
    </div>
  );
};

const Upgrade = () => {
  const [plan, setPlan] = useState<PlanKey>("annual");
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const amountLabel = plan === "monthly" ? "$7.95/mo" : "$69.95/yr";

  return (
    <div className="lk-cream relative min-h-dvh overflow-hidden bg-background px-6 py-6 text-foreground">
      <Grain />
      <div className="relative mx-auto flex min-h-[calc(100dvh-3rem)] max-w-lg flex-col">
        {/* An exit that isn't "pay" or "sign out": go back where you came from. */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="-ml-1 mb-3 flex items-center gap-1.5 self-start text-sm text-dim transition-colors hover:text-bone"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
        </button>

        {/* my-auto vertically centers the card on tall screens; it collapses and
            top-aligns when the content is taller than the viewport. */}
        <div className="my-auto">
          <div className="mb-5 text-center">
            <LkMonogram tone="ink" className="mx-auto mb-3 h-9 w-12" />
            <Eyebrow tone="gold" className="mb-1.5 block">
              Keep your ground
            </Eyebrow>
            <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-bone">
              Continue walking in freedom
            </h1>
            <p className="mt-1.5 text-sm text-bone-2">
              Keep your tools, your brotherhood, and your daily rhythm active.
            </p>
          </div>

          <div className="mb-4 flex gap-3">
            <button
              type="button"
              onClick={() => setPlan("monthly")}
              aria-pressed={plan === "monthly"}
              className={cn(
                "flex-1 rounded-lg border p-3.5 text-left transition-colors",
                plan === "monthly"
                  ? "border-gold bg-gold/10"
                  : "border-line bg-raised hover:border-line-soft"
              )}
            >
              <p className="font-display text-sm font-bold uppercase tracking-wide text-bone">Monthly</p>
              <p className="font-display text-2xl font-bold text-bone">
                $7.95<span className="text-sm font-normal text-dim">/mo</span>
              </p>
            </button>
            <button
              type="button"
              onClick={() => setPlan("annual")}
              aria-pressed={plan === "annual"}
              className={cn(
                "relative flex-1 rounded-lg border p-3.5 text-left transition-colors",
                plan === "annual"
                  ? "border-gold bg-gold/10"
                  : "border-line bg-raised hover:border-line-soft"
              )}
            >
              <span className="absolute -top-2.5 right-3 rounded-full bg-gold px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                Save 27%
              </span>
              <p className="font-display text-sm font-bold uppercase tracking-wide text-bone">Annual</p>
              <p className="font-display text-2xl font-bold text-bone">
                $5.83<span className="text-sm font-normal text-dim">/mo</span>
              </p>
              <p className="text-xs text-dim">$69.95 billed annually</p>
            </button>
          </div>

          <SectionCard className="mb-4 p-4">
            <Eyebrow className="mb-2.5 block">What stays yours</Eyebrow>
            <ul className="space-y-2">
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-3 text-sm text-bone-2">
                  <Check className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
          </SectionCard>

          <CheckoutButton plan={plan} amountLabel={amountLabel} />

          <button
            type="button"
            onClick={signOut}
            className="mx-auto mt-4 block text-sm text-dim underline-offset-4 transition-colors hover:text-bone-2 hover:underline"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Upgrade;
