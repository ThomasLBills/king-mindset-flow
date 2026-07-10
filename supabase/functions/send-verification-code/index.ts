import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateCode(): string {
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
    console.error("RESEND_API_KEY not configured, cannot send verification email");
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

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user exists in profiles and hasn't set password yet
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id, password_set")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (!profile) {
      // Don't reveal whether email exists
      return new Response(JSON.stringify({ sent: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (profile.password_set) {
      // Uniform response: do not reveal that this email has completed setup
      return new Response(JSON.stringify({ sent: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check active entitlement
    const { data: entitlement } = await supabase
      .from("entitlements")
      .select("active")
      .eq("user_id", profile.user_id)
      .eq("entitlement_type", "course_app_access")
      .eq("active", true)
      .maybeSingle();

    if (!entitlement) {
      return new Response(JSON.stringify({ sent: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Invalidate previous unused codes
    await supabase
      .from("verification_codes")
      .update({ used: true })
      .eq("email", normalizedEmail)
      .eq("used", false);

    // Generate new code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await supabase.from("verification_codes").insert({
      email: normalizedEmail,
      code,
      expires_at: expiresAt,
    });

    console.log("Generated verification code for", normalizedEmail);

    // Send email directly via Resend, bypass auth hook entirely
    const emailSent = await sendEmailViaResend(normalizedEmail, code);
    if (!emailSent) {
      console.error("Failed to send verification email to", normalizedEmail);
    }

    return new Response(JSON.stringify({ sent: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("send-verification-code error:", err.message);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
