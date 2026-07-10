import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

const VALID_PLANS = ["eight-week-course", "monthly", "annual"];

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => chars[b % chars.length]).join("");
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
    let tempPassword: string | undefined;
    const isNewUser = !existingProfile;

    if (existingProfile) {
      userId = existingProfile.user_id;
      console.log("User already exists:", userId);

      // If user still hasn't set their permanent password, mint a FRESH temp
      // password and return it in this response. Never persist the plaintext.
      const { data: profileFlags } = await supabase
        .from("profiles")
        .select("must_change_password, password_set")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileFlags?.must_change_password || profileFlags?.password_set === false) {
        tempPassword = generateTempPassword();
        await supabase.auth.admin.updateUserById(userId, { password: tempPassword });
        console.log("Rotated temp password for existing uninitialized user:", userId);
      }
    } else {
      // Create user with a temporary password
      tempPassword = generateTempPassword();
      const { data: userData, error: createError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { name: name || "" },
      });

      if (createError) {
        // User might exist in auth but not profiles
        if ((createError as any).code === "email_exists" || createError.status === 422) {
          const { data: users } = await supabase.auth.admin.listUsers();
          const existing = users?.users?.find((u: any) => u.email === normalizedEmail);
          if (existing) {
            userId = existing.id;
            console.log("User exists in auth but not profiles:", userId);
          } else {
            console.error("Failed to create or find user:", createError);
            return new Response(JSON.stringify({ error: "Failed to provision user" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } else {
          console.error("Create user error:", createError);
          return new Response(JSON.stringify({ error: "Failed to provision user" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        userId = userData.user.id;
        console.log("Created new user:", userId, normalizedEmail);
      }
    }

    // 2. Upsert profile with must_change_password flag for new users
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        user_id: userId!,
        email: normalizedEmail,
        name: name || "",
        display_name: name || "",
        first_name: name || "",
        ...(isNewUser ? { must_change_password: true, password_set: false } : {}),
      },
      { onConflict: "user_id" }
    );
    if (profileError) {
      console.error("Profile upsert error:", profileError.message);
    }

    // 3. Upsert entitlement with 60-day trial expiry
    const trialExpiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
    const { error: entitlementError } = await supabase.from("entitlements").upsert(
      {
        user_id: userId!,
        entitlement_type: "course_app_access",
        active: true,
        source: `zapier_${plan_key}`,
        expires_at: trialExpiresAt,
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
      stripe_payment_intent_id,
      amount: 0,
      currency: "usd",
      status: "paid",
    });

    console.log("Provisioned user via Zapier, plan:", plan_key, "isNewUser:", isNewUser);

    // Build response with clear new vs existing user distinction.
    // The plaintext password is only ever sent back in THIS response, never
    // persisted in the database.
    return new Response(JSON.stringify({
      success: true,
      user_id: userId!,
      is_new_user: isNewUser,
      ...(tempPassword ? { temporary_password: tempPassword } : {}),
      ...(isNewUser ? {} : { message: "User already exists" }),
    }), {
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
