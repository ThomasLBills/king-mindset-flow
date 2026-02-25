import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

const VALID_PLANS = ["eight-week-course", "monthly", "annual"];

function generateVerificationCode(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(arr[0] % 1000000).padStart(6, "0");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Auth: x-api-key header
  const ZAPIER_API_KEY = Deno.env.get("ZAPIER_API_KEY");
  if (!ZAPIER_API_KEY) {
    console.error("ZAPIER_API_KEY not configured");
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey !== ZAPIER_API_KEY) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { email, name, plan_key, stripe_payment_intent_id } = body;

    // Validate required fields
    if (!email || !plan_key || !stripe_payment_intent_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, plan_key, stripe_payment_intent_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize + validate email
    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate plan_key
    if (!VALID_PLANS.includes(plan_key)) {
      return new Response(
        JSON.stringify({ error: `Invalid plan_key. Must be one of: ${VALID_PLANS.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate stripe_payment_intent_id format
    if (typeof stripe_payment_intent_id !== "string" || stripe_payment_intent_id.length < 5) {
      return new Response(JSON.stringify({ error: "Invalid stripe_payment_intent_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Check if user already exists in profiles
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    let userId: string;

    if (existingProfile) {
      userId = existingProfile.user_id;
      console.log("User already exists:", userId);
    } else {
      // Generate verification code BEFORE inviting so auth-email-hook renders code template
      await storeVerificationCode(normalizedEmail, supabase);

      // Use inviteUserByEmail — this triggers auth-email-hook which will send the code email
      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(normalizedEmail, {
        data: { name: name || "" },
        redirectTo: "https://app.liberatedkings.com/setup-account",
      });

      if (inviteError) {
        // User might exist in auth but not profiles
        if ((inviteError as any).code === "email_exists" || inviteError.status === 422) {
          const { data: users } = await supabase.auth.admin.listUsers();
          const existing = users?.users?.find((u: any) => u.email === normalizedEmail);
          if (existing) {
            userId = existing.id;
            console.log("User exists in auth but not profiles:", userId);
          } else {
            console.error("Failed to invite or find user:", inviteError);
            return new Response(JSON.stringify({ error: "Failed to provision user" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } else {
          console.error("Invite error:", inviteError);
          return new Response(JSON.stringify({ error: "Failed to provision user" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        userId = inviteData.user.id;
        console.log("Invited new user:", userId, normalizedEmail);
      }
    }

    // 2. Upsert profile
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        user_id: userId!,
        email: normalizedEmail,
        name: name || "",
        display_name: name || "",
        first_name: name || "",
      },
      { onConflict: "user_id" }
    );
    if (profileError) {
      console.error("Profile upsert error:", profileError.message);
    }

    // 3. Upsert entitlement
    const { error: entitlementError } = await supabase.from("entitlements").upsert(
      {
        user_id: userId!,
        entitlement_type: "course_app_access",
        active: true,
        source: `zapier_${plan_key}`,
      },
      { onConflict: "user_id,entitlement_type" }
    );
    if (entitlementError) {
      console.error("Entitlement upsert error:", entitlementError.message);
      return new Response(JSON.stringify({ error: "Failed to set entitlement" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Record payment reference
    await supabase.from("payments").insert({
      user_id: userId!,
      stripe_payment_intent_id: stripe_payment_intent_id,
      amount: 0,
      currency: "usd",
      status: "paid",
    });

    console.log("Provisioned user via Zapier, plan:", plan_key);

    return new Response(JSON.stringify({ success: true, user_id: userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("zapier-provision-user error:", err.message);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function storeVerificationCode(email: string, supabase: any): Promise<void> {
  // Invalidate previous codes
  await supabase
    .from("verification_codes")
    .update({ used: true })
    .eq("email", email)
    .eq("used", false);

  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await supabase.from("verification_codes").insert({
    email,
    code,
    expires_at: expiresAt,
  });

  console.log("Stored verification code for", email);
}
