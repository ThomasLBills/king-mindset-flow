import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Stripe webhook handler - processes subscription events
// Verifies signatures, enforces idempotency, manages entitlements

async function verifyStripeSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const parts = signature.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.split("=")[1];
  const v1Signatures = parts.filter((p) => p.startsWith("v1=")).map((p) => p.split("=")[1]);

  if (!timestamp || !v1Signatures.length) return false;

  // Check timestamp is within 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  const expectedSig = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison to prevent timing attacks
  const expectedBytes = new TextEncoder().encode(expectedSig);
  for (const v1Sig of v1Signatures) {
    const sigBytes = new TextEncoder().encode(v1Sig);
    if (sigBytes.length === expectedBytes.length) {
      let mismatch = 0;
      for (let i = 0; i < sigBytes.length; i++) {
        mismatch |= sigBytes[i] ^ expectedBytes[i];
      }
      if (mismatch === 0) return true;
    }
  }
  return false;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    console.error("Missing Stripe configuration");
    return new Response("Server misconfigured", { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error("Missing stripe-signature header");
    return new Response("Missing signature", { status: 400 });
  }

  // Verify webhook signature
  const valid = await verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET);
  if (!valid) {
    console.error("Invalid webhook signature");
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(body);
  console.log("Webhook received:", event.type, event.id);

  // Idempotency check
  const { data: existingEvent } = await supabase
    .from("webhook_events")
    .select("stripe_event_id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (existingEvent) {
    console.log("Duplicate event, skipping:", event.id);
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Record event
  await supabase.from("webhook_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
    status: "processing",
  });

  try {
    const handled = [
      "checkout.session.completed",
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "invoice.payment_succeeded",
      "invoice.payment_failed",
    ];

    if (!handled.includes(event.type)) {
      await supabase
        .from("webhook_events")
        .update({ status: "ignored", processed_at: new Date().toISOString() })
        .eq("stripe_event_id", event.id);
      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event.data.object, supabase, STRIPE_SECRET_KEY);
    } else if (event.type.startsWith("customer.subscription.")) {
      await handleSubscriptionChange(event.data.object, supabase, STRIPE_SECRET_KEY);
    } else if (event.type === "invoice.payment_succeeded") {
      await handleInvoicePayment(event.data.object, supabase, true);
    } else if (event.type === "invoice.payment_failed") {
      await handleInvoicePayment(event.data.object, supabase, false);
    }

    await supabase
      .from("webhook_events")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("stripe_event_id", event.id);

    console.log("Event processed successfully:", event.id);
  } catch (err) {
    console.error("Webhook processing error:", err);
    await supabase
      .from("webhook_events")
      .update({ status: "error", error_message: err.message, processed_at: new Date().toISOString() })
      .eq("stripe_event_id", event.id);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});

function generateVerificationCode(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(arr[0] % 1000000).padStart(6, "0");
}

async function storeVerificationCode(email: string, supabase: any): Promise<void> {
  // Invalidate previous codes
  await supabase
    .from("verification_codes")
    .update({ used: true })
    .eq("email", email)
    .eq("used", false);

  // Generate new code
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await supabase.from("verification_codes").insert({
    email,
    code,
    expires_at: expiresAt,
  });

  console.log("Stored verification code for", email);
}

async function resolveUserId(
  customerEmail: string,
  stripeCustomerId: string,
  metadata: Record<string, string>,
  supabase: any
): Promise<string | null> {
  // 1. Check metadata
  if (metadata?.user_id) {
    const { data } = await supabase.from("profiles").select("user_id").eq("user_id", metadata.user_id).maybeSingle();
    if (data) return data.user_id;
  }

  // 2. Check stripe_customers mapping
  const { data: mapping } = await supabase
    .from("stripe_customers")
    .select("user_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();
  if (mapping) return mapping.user_id;

  // 3. Find by email in profiles
  if (customerEmail) {
    const normalizedEmail = customerEmail.trim().toLowerCase();

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", normalizedEmail)
      .maybeSingle();
    if (profile) return profile.user_id;

    // 4. Generate verification code BEFORE inviting so the auth-email-hook
    //    can render the code template instead of the invite link template
    await storeVerificationCode(normalizedEmail, supabase);

    // 5. Invite user via admin API — this triggers the auth-email-hook
    //    which will find the verification code and send the code email
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(normalizedEmail, {
      data: { name: "" },
      redirectTo: "https://app.liberatedkings.com/setup-account",
    });
    if (inviteError) {
      // User might exist in auth but not profiles - try listing
      if (inviteError.status === 422 && (inviteError as any).code === "email_exists") {
        const { data: users } = await supabase.auth.admin.listUsers();
        const existing = users?.users?.find((u: any) => u.email === normalizedEmail);
        if (existing) return existing.id;
      }
      console.error("Failed to invite/find user:", inviteError);
      return null;
    }
    console.log("Stripe purchase: invited new user", inviteData.user.id, normalizedEmail);
    return inviteData.user.id;
  }

  return null;
}

async function handleCheckoutCompleted(session: any, supabase: any, stripeKey: string) {
  const customerEmail = session.customer_details?.email || session.customer_email;
  const stripeCustomerId = session.customer;

  const userId = await resolveUserId(customerEmail, stripeCustomerId, session.metadata || {}, supabase);
  if (!userId) {
    console.error("Could not resolve user for checkout:", session.id);
    return;
  }

  // Upsert stripe customer mapping
  await supabase.from("stripe_customers").upsert(
    { user_id: userId, stripe_customer_id: stripeCustomerId },
    { onConflict: "stripe_customer_id" }
  );

  // Record payment
  await supabase.from("payments").upsert(
    {
      user_id: userId,
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent,
      amount: session.amount_total || 0,
      currency: session.currency || "usd",
      status: session.payment_status || "paid",
    },
    { onConflict: "stripe_session_id" }
  );

  // If subscription, fetch and process it
  if (session.subscription) {
    const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${session.subscription}`, {
      headers: { Authorization: `Basic ${btoa(stripeKey + ":")}` },
    });
    const sub = await subRes.json();
    await processSubscription(sub, userId, supabase);
  }

  console.log("Checkout completed for user:", userId, "entitlement granted");
}

async function handleSubscriptionChange(subscription: any, supabase: any, stripeKey: string) {
  const stripeCustomerId = subscription.customer;

  // Find user
  const { data: mapping } = await supabase
    .from("stripe_customers")
    .select("user_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  if (!mapping) {
    console.error("No user mapping for customer:", stripeCustomerId);
    return;
  }

  await processSubscription(subscription, mapping.user_id, supabase);
}

async function processSubscription(subscription: any, userId: string, supabase: any) {
  const activeStatuses = ["active", "trialing"];
  const isActive = activeStatuses.includes(subscription.status);

  // Determine entitlement expiration based on the subscription's price ID.
  // Monthly grants 30 days, annual grants 365 days. Defaults to current_period_end.
  const MONTHLY_PRICE_ID = "price_1TFgdDEBAqZ3z3WsjwBo4RBl";
  const ANNUAL_PRICE_ID = "price_1TFge5EBAqZ3z3WsQfXuOwve";
  const priceId: string | undefined = subscription.items?.data?.[0]?.price?.id;
  const now = Date.now();
  // Newer Stripe API versions moved current_period_end to the subscription item.
  const periodEndUnix: number | undefined =
    subscription.current_period_end ??
    subscription.items?.data?.[0]?.current_period_end;
  let entitlementExpiresAt: string;
  if (priceId === MONTHLY_PRICE_ID) {
    entitlementExpiresAt = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();
  } else if (priceId === ANNUAL_PRICE_ID) {
    entitlementExpiresAt = new Date(now + 365 * 24 * 60 * 60 * 1000).toISOString();
  } else if (periodEndUnix) {
    entitlementExpiresAt = new Date(periodEndUnix * 1000).toISOString();
  } else {
    // Fallback: 30 days from now if Stripe didn't return a period end.
    entitlementExpiresAt = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  // Upsert subscription
  await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_end: periodEndUnix
        ? new Date(periodEndUnix * 1000).toISOString()
        : entitlementExpiresAt,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
    },
    { onConflict: "stripe_subscription_id" }
  );

  // Upsert entitlement — set active flag and expires_at based on plan duration
  await supabase.from("entitlements").upsert(
    {
      user_id: userId,
      entitlement_type: "course_app_access",
      active: isActive,
      source: "stripe",
      expires_at: entitlementExpiresAt,
    },
    { onConflict: "user_id,entitlement_type" }
  );

  console.log("Subscription processed:", subscription.id, "active:", isActive, "user:", userId);
}

async function handleInvoicePayment(invoice: any, supabase: any, succeeded: boolean) {
  const stripeCustomerId = invoice.customer;
  const { data: mapping } = await supabase
    .from("stripe_customers")
    .select("user_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  if (!mapping) return;

  if (!succeeded) {
    console.log("Payment failed for user:", mapping.user_id, "invoice:", invoice.id);
    // Don't immediately revoke - Stripe will send subscription.updated with past_due status
  } else {
    console.log("Payment succeeded for user:", mapping.user_id, "invoice:", invoice.id);
  }
}
