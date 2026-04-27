import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    if (!STRIPE_SECRET_KEY) {
      return json({ error: "Stripe not configured" }, 500);
    }

    // Authenticate the user via JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const user = userData.user;

    const { planKey } = await req.json();
    if (planKey !== "monthly" && planKey !== "annual") {
      return json({ error: "Invalid plan" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Look up price ID
    const { data: plan, error: planErr } = await admin
      .from("plans")
      .select("stripe_price_id")
      .eq("plan_key", planKey)
      .maybeSingle();
    if (planErr || !plan) return json({ error: "Plan not found" }, 404);
    const priceId = plan.stripe_price_id;

    const stripeAuth = `Basic ${btoa(STRIPE_SECRET_KEY + ":")}`;

    // Find or create Stripe customer
    let stripeCustomerId: string | null = null;
    const { data: existingMap } = await admin
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingMap?.stripe_customer_id) {
      stripeCustomerId = existingMap.stripe_customer_id;
    } else {
      const custParams = new URLSearchParams();
      if (user.email) custParams.append("email", user.email);
      custParams.append("metadata[user_id]", user.id);
      const custRes = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: { Authorization: stripeAuth, "Content-Type": "application/x-www-form-urlencoded" },
        body: custParams.toString(),
      });
      const cust = await custRes.json();
      if (cust.error) {
        console.error("Stripe customer create error:", cust.error);
        return json({ error: cust.error.message }, 400);
      }
      stripeCustomerId = cust.id;
      await admin.from("stripe_customers").upsert(
        { user_id: user.id, stripe_customer_id: stripeCustomerId },
        { onConflict: "stripe_customer_id" }
      );
    }

    // Create subscription with default_incomplete to surface a PaymentIntent
    const subParams = new URLSearchParams();
    subParams.append("customer", stripeCustomerId!);
    subParams.append("items[0][price]", priceId);
    subParams.append("payment_behavior", "default_incomplete");
    subParams.append("payment_settings[save_default_payment_method]", "on_subscription");
    subParams.append("expand[0]", "latest_invoice.payment_intent");
    subParams.append("metadata[user_id]", user.id);
    subParams.append("metadata[plan]", planKey);

    const subRes = await fetch("https://api.stripe.com/v1/subscriptions", {
      method: "POST",
      headers: { Authorization: stripeAuth, "Content-Type": "application/x-www-form-urlencoded" },
      body: subParams.toString(),
    });
    const sub = await subRes.json();
    if (sub.error) {
      console.error("Stripe subscription error:", sub.error);
      return json({ error: sub.error.message }, 400);
    }

    const clientSecret = sub.latest_invoice?.payment_intent?.client_secret;
    if (!clientSecret) {
      console.error("No client_secret on subscription:", sub.id);
      return json({ error: "Could not initialize payment" }, 500);
    }

    return json({
      clientSecret,
      subscriptionId: sub.id,
      customerId: stripeCustomerId,
    });
  } catch (err) {
    console.error("create-payment-intent error:", err);
    return json({ error: (err as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}