import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logSystemError } from "../_shared/errorLogger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, password } = await req.json();

    if (!email || !code || !password) {
      return new Response(JSON.stringify({ error: "Email, code, and password are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (typeof password !== "string") {
      return new Response(JSON.stringify({ error: "Password must be a string" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Server-side strength backstop (mirrors src/lib/passwordStrength.ts).
    const strong =
      password.length >= 10 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password);
    if (!strong) {
      return new Response(
        JSON.stringify({
          error:
            "Password not strong enough. Use 10+ characters with an uppercase letter, a number, and a symbol (like #).",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up the verification code
    const { data: codeRecord } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("code", trimmedCode)
      .eq("used", false)
      .maybeSingle();

    if (!codeRecord) {
      return new Response(JSON.stringify({ error: "Invalid verification code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiry
    if (new Date(codeRecord.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "expired" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the user in profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Account not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Set the password via admin API
    const { error: updateErr } = await supabase.auth.admin.updateUserById(profile.user_id, {
      password,
      email_confirm: true, // Ensure email is confirmed
    });

    if (updateErr) {
      await logSystemError({
        functionName: "verify-code-set-password",
        error: updateErr,
        context: { stage: "updateUserById" },
      });
      return new Response(JSON.stringify({ error: "Failed to set password" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark code as used
    await supabase
      .from("verification_codes")
      .update({ used: true })
      .eq("id", codeRecord.id);

    // Mark password as permanently set on the profile.
    await supabase
      .from("profiles")
      .update({ password_set: true, must_change_password: false })
      .eq("user_id", profile.user_id);

    console.log("Password set successfully for", normalizedEmail);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    await logSystemError({
      functionName: "verify-code-set-password",
      error: err,
      severity: "fatal",
    });
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
