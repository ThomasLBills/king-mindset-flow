import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify caller is admin
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

    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "userId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent self-deletion
    if (userId === user.id) {
      return new Response(JSON.stringify({ error: "Cannot delete your own account" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete all user data from public tables (no FK cascades from auth.users)
    const tables = [
      { table: "daily_check_ins", col: "user_id" },
      { table: "daily_completions", col: "user_id" },
      { table: "evidence_events", col: "user_id" },
      { table: "freedom_streaks", col: "user_id" },
      { table: "relapse_events", col: "user_id" },
      { table: "crisis_button_events", col: "user_id" },
      { table: "pattern_insights", col: "user_id" },
      { table: "course_progress", col: "user_id" },
      { table: "lesson_progress", col: "user_id" },
      { table: "curriculum_lesson_progress", col: "user_id" },
      { table: "user_action_items", col: "user_id" },
      { table: "user_journal_entries", col: "user_id" },
      { table: "user_enrollments", col: "user_id" },
      { table: "chat_messages", col: "user_id" },
      { table: "chat_reactions", col: "user_id" },
      { table: "chat_flags", col: "flagged_by" },
      { table: "chat_channel_members", col: "user_id" },
      { table: "chat_dms", col: "user_a" },
      { table: "chat_dms", col: "user_b" },
      { table: "brotherhood_connections", col: "requester_id" },
      { table: "brotherhood_connections", col: "recipient_id" },
      { table: "entitlements", col: "user_id" },
      { table: "subscriptions", col: "user_id" },
      { table: "stripe_customers", col: "user_id" },
      { table: "payments", col: "user_id" },
      { table: "user_roles", col: "user_id" },
      { table: "admin_audit_log", col: "admin_user_id" },
      { table: "profiles", col: "user_id" },
    ];

    for (const { table, col } of tables) {
      const { error: delErr } = await supabase.from(table).delete().eq(col, userId);
      if (delErr) console.warn(`Failed to delete from ${table}: ${delErr.message}`);
    }

    // Finally delete the auth user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    console.log(`Admin ${user.id} deleted user ${userId}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("admin-delete-user error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
