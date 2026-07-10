import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateTempPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const all = upper + lower + digits;
  const arr = new Uint32Array(8);
  crypto.getRandomValues(arr);
  // Ensure at least one of each type
  let pw = "";
  pw += upper[arr[0] % upper.length];
  pw += lower[arr[1] % lower.length];
  pw += digits[arr[2] % digits.length];
  for (let i = 3; i < 8; i++) {
    pw += all[arr[i] % all.length];
  }
  // Shuffle
  const shuffled = pw.split("");
  for (let i = shuffled.length - 1; i > 0; i--) {
    const rnd = new Uint32Array(1);
    crypto.getRandomValues(rnd);
    const j = rnd[0] % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.join("");
}

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

    const { email, name, grantAccess } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tempPassword = generateTempPassword();
    let newUserId: string;

    // Create user with temp password, no email sent
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name: name || "" },
    });

    if (createError) {
      if (createError.status === 422 && (createError as any).code === "email_exists") {
        console.log(`User ${email} already exists, deleting and recreating...`);
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existingUser = listData?.users?.find((u: any) => u.email === email);
        if (existingUser) {
          await supabase.auth.admin.deleteUser(existingUser.id);
        }
        const { data: retryUser, error: retryError } = await supabase.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { name: name || "" },
        });
        if (retryError) throw retryError;
        newUserId = retryUser.user.id;
      } else {
        throw createError;
      }
    } else {
      newUserId = newUser.user.id;
    }

    // Set must_change_password. Plaintext temp password is returned in the
    // response body only, never persisted to the database.
    await supabase
      .from("profiles")
      .update({ must_change_password: true, password_set: false })
      .eq("user_id", newUserId);

    // Grant entitlement if requested
    if (grantAccess) {
      await supabase.from("entitlements").upsert(
        { user_id: newUserId, entitlement_type: "course_app_access", active: true, source: "admin_grant" },
        { onConflict: "user_id,entitlement_type" }
      );
    }

    console.log(`Admin ${user.id} created user ${newUserId} (${email}) with temp password`);

    return new Response(JSON.stringify({ success: true, userId: newUserId, tempPassword, email }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("admin-create-user error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
