import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logSystemError } from "../_shared/errorLogger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  let callerId: string | null = null;
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ---- Auth: caller must be an admin ----
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const adminUser = userData.user;
    callerId = adminUser.id;

    const { data: adminRole } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", adminUser.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) return json({ error: "Forbidden" }, 403);

    // ---- Body ----
    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === "stop") {
      const targetUserId = typeof body?.target_user_id === "string" ? body.target_user_id : null;
      await admin.from("admin_audit_log").insert({
        admin_user_id: adminUser.id,
        action: "impersonation_stop",
        entity_type: "user",
        entity_id: targetUserId,
        after_json: { stopped_at: new Date().toISOString() },
      });
      return json({ ok: true });
    }

    if (action !== "start") {
      return json({ error: "Invalid action. Use 'start' or 'stop'." }, 400);
    }

    const targetUserId = body?.target_user_id;
    if (typeof targetUserId !== "string" || targetUserId.length < 8) {
      return json({ error: "target_user_id required" }, 400);
    }
    if (targetUserId === adminUser.id) {
      return json({ error: "Cannot impersonate yourself" }, 400);
    }

    // Target must exist and must NOT be an admin
    const { data: targetProfile, error: profileErr } = await admin
      .from("profiles")
      .select("user_id, email, display_name, first_name, avatar_url")
      .eq("user_id", targetUserId)
      .maybeSingle();
    if (profileErr) throw profileErr;
    if (!targetProfile) return json({ error: "Target user not found" }, 404);

    const { data: targetRole } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", targetUserId)
      .eq("role", "admin")
      .maybeSingle();
    if (targetRole) {
      return json({ error: "Cannot impersonate another admin" }, 403);
    }

    // ---- Mint a real Supabase session for the target ----
    // 1) Generate a magiclink to obtain a hashed OTP token.
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: targetProfile.email,
    });
    if (linkErr || !link?.properties?.hashed_token) {
      await logSystemError({
        functionName: "admin-impersonate",
        error: linkErr ?? new Error("generateLink returned no token"),
        userId: callerId,
        requestId,
        context: { stage: "generateLink", target_user_id: targetUserId },
      });
      return json({ error: "Could not mint impersonation session" }, 500);
    }

    // 2) Redeem the hashed token to get real access + refresh tokens.
    //    Use a fresh (non-service) client scoped to the anon key so that
    //    verifyOtp hits the auth endpoint as an unauthenticated caller.
    const anonClient = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    const { data: verified, error: verifyErr } = await anonClient.auth.verifyOtp({
      type: "magiclink",
      token_hash: link.properties.hashed_token,
    });
    if (verifyErr || !verified?.session) {
      await logSystemError({
        functionName: "admin-impersonate",
        error: verifyErr ?? new Error("verifyOtp returned no session"),
        userId: callerId,
        requestId,
        context: { stage: "verifyOtp", target_user_id: targetUserId },
      });
      return json({ error: "Could not verify impersonation session" }, 500);
    }

    // ---- Audit ----
    await admin.from("admin_audit_log").insert({
      admin_user_id: adminUser.id,
      action: "impersonation_start",
      entity_type: "user",
      entity_id: targetUserId,
      after_json: {
        target_email: targetProfile.email,
        started_at: new Date().toISOString(),
        expires_at: new Date((verified.session.expires_at ?? 0) * 1000).toISOString(),
      },
    });

    console.log(`Admin ${adminUser.id} started impersonation of ${targetUserId}`);

    return json({
      access_token: verified.session.access_token,
      refresh_token: verified.session.refresh_token,
      expires_at: verified.session.expires_at,
      target_profile: targetProfile,
    });
  } catch (err) {
    await logSystemError({
      functionName: "admin-impersonate",
      error: err,
      severity: "fatal",
      userId: callerId,
      requestId,
    });
    return json({ error: (err as Error).message ?? "Server error" }, 500);
  }
});