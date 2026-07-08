import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
      return new Response(JSON.stringify({ error: "Stripe not configured. Please add STRIPE_SECRET_KEY." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { planKey, email, returnUrl } = await req.json();

    const ALLOWED_ORIGINS = [
      "https://app.liberatedkings.com",
      "https://king-mindset-flow.lovable.app",
    ];
    let safeReturnOrigin = "https://app.liberatedkings.com";
    if (typeof returnUrl === "string" && returnUrl.length > 0) {
      try {
        const parsed = new URL(returnUrl);
        if (ALLOWED_ORIGINS.includes(parsed.origin)) {
          safeReturnOrigin = parsed.origin;
        }
      } catch {
        // fall through to default
      }
    }

    // Get the Supabase client to look up price ID
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const planRes = await fetch(`${SUPABASE_URL}/rest/v1/plans?plan_key=eq.${planKey}&select=stripe_price_id,amount,currency,interval,name`, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    const plans = await planRes.json();
    if (!plans?.length) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const plan = plans[0];
    let priceId = plan.stripe_price_id;
    const stripeAuth = `Basic ${btoa(STRIPE_SECRET_KEY + ":")}`;

    const priceRes = await fetch(`https://api.stripe.com/v1/prices/${priceId}`, {
      headers: { Authorization: stripeAuth },
    });
    const price = await priceRes.json();
    if (price.error) {
      console.error("Stripe price lookup error:", price.error);
      return new Response(JSON.stringify({ error: price.error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (price.type !== "recurring") {
      const recurringPriceParams = new URLSearchParams();
      recurringPriceParams.append("currency", plan.currency || "usd");
      recurringPriceParams.append("unit_amount", String(plan.amount));
      recurringPriceParams.append("recurring[interval]", plan.interval === "year" ? "year" : "month");
      recurringPriceParams.append("product_data[name]", plan.name || `Liberated Kings ${planKey}`);
      recurringPriceParams.append("metadata[plan_key]", planKey);

      const recurringPriceRes = await fetch("https://api.stripe.com/v1/prices", {
        method: "POST",
        headers: { Authorization: stripeAuth, "Content-Type": "application/x-www-form-urlencoded" },
        body: recurringPriceParams.toString(),
      });
      const recurringPrice = await recurringPriceRes.json();
      if (recurringPrice.error) {
        console.error("Stripe recurring price create error:", recurringPrice.error);
        return new Response(JSON.stringify({ error: recurringPrice.error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      priceId = recurringPrice.id;
      await fetch(`${SUPABASE_URL}/rest/v1/plans?plan_key=eq.${planKey}`, {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stripe_price_id: priceId }),
      });
    }

    // Get user ID + email from auth header if logged in
    let userId: string | null = null;
    let userEmail: string | null = email || null;
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_SERVICE_ROLE_KEY },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        userId = userData.id;
        userEmail = userData.email || userEmail;
      }
    }

    // Find or create Stripe customer linked to this Supabase user
    let stripeCustomerId: string | null = null;
    if (userId) {
      // Look up existing mapping
      const mapRes = await fetch(
        `${SUPABASE_URL}/rest/v1/stripe_customers?user_id=eq.${userId}&select=stripe_customer_id`,
        {
          headers: {
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
        }
      );
      const mapped = await mapRes.json();
      if (Array.isArray(mapped) && mapped[0]?.stripe_customer_id) {
        stripeCustomerId = mapped[0].stripe_customer_id;
      }

      // Verify the customer still exists in Stripe (handles test/live key swaps)
      if (stripeCustomerId) {
        const verifyRes = await fetch(`https://api.stripe.com/v1/customers/${stripeCustomerId}`, {
          headers: { Authorization: stripeAuth },
        });
        const verify = await verifyRes.json();
        if (verify?.error || verify?.deleted) {
          stripeCustomerId = null;
        }
      }

      if (!stripeCustomerId) {
        // Try to find an existing Stripe customer by email to avoid duplicates
        if (userEmail) {
          const searchRes = await fetch(
            `https://api.stripe.com/v1/customers?email=${encodeURIComponent(userEmail)}&limit=1`,
            { headers: { Authorization: stripeAuth } }
          );
          const search = await searchRes.json();
          if (search?.data?.[0]?.id) {
            stripeCustomerId = search.data[0].id;
            // Backfill metadata with our user_id
            const updParams = new URLSearchParams();
            updParams.append("metadata[user_id]", userId);
            await fetch(`https://api.stripe.com/v1/customers/${stripeCustomerId}`, {
              method: "POST",
              headers: { Authorization: stripeAuth, "Content-Type": "application/x-www-form-urlencoded" },
              body: updParams.toString(),
            });
          }
        }

        // Otherwise, create a fresh Stripe customer
        if (!stripeCustomerId) {
          const custParams = new URLSearchParams();
          if (userEmail) custParams.append("email", userEmail);
          custParams.append("metadata[user_id]", userId);
          const custRes = await fetch("https://api.stripe.com/v1/customers", {
            method: "POST",
            headers: { Authorization: stripeAuth, "Content-Type": "application/x-www-form-urlencoded" },
            body: custParams.toString(),
          });
          const cust = await custRes.json();
          if (cust.error) {
            console.error("Stripe customer create error:", cust.error);
            return new Response(JSON.stringify({ error: cust.error.message }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          stripeCustomerId = cust.id;
        }

        // Persist mapping in stripe_customers
        await fetch(`${SUPABASE_URL}/rest/v1/stripe_customers`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates",
          },
          body: JSON.stringify({ user_id: userId, stripe_customer_id: stripeCustomerId }),
        });
      }
    }

    // Create Stripe Checkout Session
    const params = new URLSearchParams();
    params.append("mode", "subscription");
    params.append("line_items[0][price]", priceId);
    params.append("line_items[0][quantity]", "1");
    params.append("success_url", `${safeReturnOrigin}/thank-you?session_id={CHECKOUT_SESSION_ID}`);
    params.append("cancel_url", `${safeReturnOrigin}/upgrade?canceled=true`);
    params.append("metadata[plan]", planKey);
    if (userId) {
      params.append("metadata[user_id]", userId);
      params.append("subscription_data[metadata][user_id]", userId);
      params.append("subscription_data[metadata][plan]", planKey);
    }
    if (stripeCustomerId) {
      // Reuse existing Stripe customer — prevents Stripe from treating user as new
      params.append("customer", stripeCustomerId);
      params.append("customer_update[address]", "auto");
      params.append("customer_update[name]", "auto");
    } else if (userEmail) {
      params.append("customer_email", userEmail);
    }

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: stripeAuth,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await stripeRes.json();
    if (session.error) {
      console.error("Stripe error:", session.error);
      return new Response(JSON.stringify({ error: session.error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Checkout session created:", session.id);

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
