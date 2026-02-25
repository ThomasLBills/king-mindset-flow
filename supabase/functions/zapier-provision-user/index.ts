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

function buildVerificationEmailHtml(code: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="background-color:#ffffff;font-family:'Inter',Arial,sans-serif">
  <div style="padding:40px 32px;max-width:480px;margin:0 auto">
    <h1 style="font-family:'Crimson Pro',Georgia,serif;font-size:26px;font-weight:600;color:#1A1A1A;margin:0 0 16px">Welcome to Liberated Kings</h1>
    <p style="font-size:15px;color:#555555;line-height:1.6;margin:0 0 28px">Go to <strong>app.liberatedkings.com</strong> and click &ldquo;New here? Set up your account&rdquo; to create your account using the code below:</p>
    <div style="background-color:#F9F5EB;border-radius:12px;padding:20px;text-align:center;margin:0 0 28px;border:1px solid rgba(201,168,76,0.3)">
      <p style="font-size:36px;font-weight:700;color:#1A1A1A;letter-spacing:8px;margin:0;font-family:'Inter',Arial,sans-serif">${code}</p>
    </div>
    <p style="font-size:15px;color:#555555;line-height:1.6;margin:0 0 28px">This code expires in 24 hours.</p>
    <hr style="border-color:rgba(201,168,76,0.2);margin:32px 0">
    <p style="font-size:12px;color:#999999;margin:0;line-height:1.5">If you were not expecting this, you can safely disregard this message.</p>
  </div>
</body>
</html>`;
}

async function sendEmailViaResend(to: string, code: string): Promise<boolean> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("RESEND_API_KEY not configured — cannot send verification email");
    return false;
  }

  const html = buildVerificationEmailHtml(code);

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Liberated Kings <noreply@notify.liberatedkings.com>",
      to: [to],
      subject: "Your Liberated Kings verification code",
      html,
    }),
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    console.error("Resend API error:", resp.status, errBody);
    return false;
  }

  const result = await resp.json();
  console.log("Verification email sent via Resend:", result.id, "to:", to);
  return true;
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
      // Create user directly (no invite email — we send verification code separately)
      const { data: userData, error: createError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
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

    // 5. Generate verification code and send email directly via Resend
    const code = await storeVerificationCode(normalizedEmail, supabase);
    const emailSent = await sendEmailViaResend(normalizedEmail, code);
    if (!emailSent) {
      console.error("Failed to send verification email to", normalizedEmail);
    }

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

async function storeVerificationCode(email: string, supabase: any): Promise<string> {
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
  return code;
}
