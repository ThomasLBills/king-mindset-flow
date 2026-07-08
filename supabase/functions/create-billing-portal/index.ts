import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) {
      return new Response(JSON.stringify({ error: "Stripe not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get user from auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get stripe customer ID
    const { data: customer } = await supabase
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!customer?.stripe_customer_id) {
      return new Response(JSON.stringify({
        error: "No Stripe billing account is linked to your profile.",
        code: "no_stripe_customer",
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { returnUrl } = await req.json();

    const ALLOWED_ORIGINS = [
      "https://app.liberatedkings.com",
      "https://king-mindset-flow.lovable.app",
    ];
    let safeReturnUrl = "https://app.liberatedkings.com/billing";
    if (typeof returnUrl === "string" && returnUrl.length > 0) {
      try {
        const parsed = new URL(returnUrl);
        if (ALLOWED_ORIGINS.includes(parsed.origin)) {
          safeReturnUrl = returnUrl;
        }
      } catch {
        // fall through to default
      }
    }

    // Create billing portal session
    const params = new URLSearchParams();
    params.append("customer", customer.stripe_customer_id);
    params.append("return_url", safeReturnUrl);

    const stripeRes = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(STRIPE_SECRET_KEY + ":")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const portal = await stripeRes.json();
    if (portal.error) {
      console.error("Stripe portal error:", portal.error);
      const isPortalConfig =
        typeof portal.error.message === "string" &&
        portal.error.message.toLowerCase().includes("configuration");
      return new Response(JSON.stringify({
        error: portal.error.message,
        code: isPortalConfig ? "portal_not_configured" : "stripe_error",
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!portal.url) {
      return new Response(JSON.stringify({
        error: "Stripe did not return a portal link.",
        code: "missing_portal_url",
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Billing portal created for user:", user.id);

    return new Response(JSON.stringify({ url: portal.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-billing-portal error:", err);
    return new Response(JSON.stringify({
      error: err.message ?? "Unexpected server error",
      code: "server_error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
