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
      return new Response(JSON.stringify({ sent: true, already_setup: true }), {
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

    // Try inviteUserByEmail first (works for unconfirmed users)
    const { error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(normalizedEmail, {
      data: { name: "" },
      redirectTo: "https://app.liberatedkings.com/setup-account",
    });

    if (inviteErr) {
      console.log("inviteUserByEmail failed (user likely confirmed), trying password reset trigger:", inviteErr.message);
      // For already-confirmed users, use resetPasswordForEmail to trigger auth-email-hook
      // The hook will detect the pending verification code and send the code email instead
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: "https://app.liberatedkings.com/setup-account",
      });
      if (resetErr) {
        console.error("resetPasswordForEmail also failed:", resetErr.message);
      } else {
        console.log("Triggered password reset email for", normalizedEmail, "(hook will send code instead)");
      }
    } else {
      console.log("Invite email triggered for", normalizedEmail);
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
