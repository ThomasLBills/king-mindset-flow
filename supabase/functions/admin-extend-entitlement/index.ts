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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userId, days = 30 } = await req.json();
    if (!userId || typeof days !== "number" || days <= 0) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Read existing entitlement
    const { data: existing } = await supabase
      .from("entitlements")
      .select("expires_at")
      .eq("user_id", userId)
      .eq("entitlement_type", "course_app_access")
      .maybeSingle();

    // Base = existing future expiration, otherwise now
    const now = new Date();
    const base =
      existing?.expires_at && new Date(existing.expires_at) > now
        ? new Date(existing.expires_at)
        : now;
    const newExpires = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

    const { error } = await supabase.from("entitlements").upsert(
      {
        user_id: userId,
        entitlement_type: "course_app_access",
        active: true,
        source: "admin_extend",
        expires_at: newExpires.toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,entitlement_type" }
    );

    if (error) throw error;

    console.log(`Admin ${user.id} extended entitlement for ${userId} by ${days} days → ${newExpires.toISOString()}`);

    return new Response(JSON.stringify({ success: true, expires_at: newExpires.toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("admin-extend-entitlement error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});