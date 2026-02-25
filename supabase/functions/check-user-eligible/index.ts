import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    if (!email) {
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

    // Check if user exists in profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id, password_set")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (!profile) {
      return new Response(JSON.stringify({ eligible: false, reason: "no_account" }), {
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
      return new Response(JSON.stringify({ eligible: false, reason: "no_entitlement" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const passwordSet = profile.password_set ?? false;

    // If user has not set a password, generate a verification code and re-send invite
    if (!passwordSet) {
      try {
        // Invalidate old codes
        await supabase
          .from("verification_codes")
          .update({ used: true })
          .eq("email", normalizedEmail)
          .eq("used", false);

        // Generate new code
        const codeArr = new Uint32Array(1);
        crypto.getRandomValues(codeArr);
        const verificationCode = String(codeArr[0] % 1000000).padStart(6, "0");

        await supabase.from("verification_codes").insert({
          email: normalizedEmail,
          code: verificationCode,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });

        // Re-send invite to trigger the email hook (which will use the code template)
        await supabase.auth.admin.inviteUserByEmail(normalizedEmail, {
          data: { name: "" },
          redirectTo: "https://app.liberatedkings.com/setup-account",
        });
        console.log("Re-sent invite with verification code to", normalizedEmail);
      } catch (inviteErr) {
        console.error("Failed to re-send invite:", inviteErr);
      }
    }

    return new Response(JSON.stringify({ eligible: true, password_set: passwordSet }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("check-user-eligible error:", err.message);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
