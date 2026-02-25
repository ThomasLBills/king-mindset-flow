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

    const { email, password, name, grantAccess, sendInvite, action } = await req.json();

    // Handle resend invite for existing user
    if (action === "resend_invite") {
      if (!email) {
        return new Response(JSON.stringify({ error: "Email required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Generate a new verification code
      await supabase.from("verification_codes").update({ used: true }).eq("email", normalizedEmail).eq("used", false);
      const codeArr = new Uint32Array(1);
      crypto.getRandomValues(codeArr);
      const verificationCode = String(codeArr[0] % 1000000).padStart(6, "0");
      await supabase.from("verification_codes").insert({
        email: normalizedEmail,
        code: verificationCode,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      // Re-send the invite which triggers the email hook (will use code template)
      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(normalizedEmail, {
        redirectTo: "https://app.liberatedkings.com/setup-account",
      });

      if (inviteError) {
        if (inviteError.status === 422 && (inviteError as any).code === "email_exists") {
          // User exists and confirmed — send a recovery link instead
          const { error: linkError } = await supabase.auth.admin.generateLink({
            type: "recovery",
            email: normalizedEmail,
            options: { redirectTo: "https://app.liberatedkings.com/reset-password" },
          });
          if (linkError) throw linkError;
        } else {
          throw inviteError;
        }
      }

      console.log(`Admin ${user.id} resent invite (with verification code) to ${normalizedEmail}`);
      return new Response(JSON.stringify({ success: true, message: "Invite sent" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create new user
    if (!email) {
      return new Response(JSON.stringify({ error: "Email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let newUserId: string;

    if (sendInvite) {
      const normalizedEmail = email.trim().toLowerCase();

      // Generate verification code before inviting so the auth-email-hook
      // renders the code template instead of the invite link template
      await supabase.from("verification_codes").update({ used: true }).eq("email", normalizedEmail).eq("used", false);
      const codeArr = new Uint32Array(1);
      crypto.getRandomValues(codeArr);
      const verificationCode = String(codeArr[0] % 1000000).padStart(6, "0");
      await supabase.from("verification_codes").insert({
        email: normalizedEmail,
        code: verificationCode,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      // Invite flow: creates user + sends invite email (hook will use code template)
      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { name: name || "" },
        redirectTo: "https://app.liberatedkings.com/setup-account",
      });

      if (inviteError) {
        if (inviteError.status === 422 && (inviteError as any).code === "email_exists") {
          console.log(`User ${email} already exists in auth, deleting and re-inviting...`);
          const { data: listData } = await supabase.auth.admin.listUsers();
          const existingUser = listData?.users?.find((u: any) => u.email === email);
          if (existingUser) {
            await supabase.auth.admin.deleteUser(existingUser.id);
          }
          const { data: retryData, error: retryError } = await supabase.auth.admin.inviteUserByEmail(email, {
            data: { name: name || "" },
            redirectTo: "https://app.liberatedkings.com/setup-account",
          });
          if (retryError) throw retryError;
          newUserId = retryData.user.id;
          console.log(`Admin ${user.id} re-invited user ${newUserId} (${email})`);
        } else {
          throw inviteError;
        }
      } else {
        newUserId = inviteData.user.id;
        console.log(`Admin ${user.id} invited user ${newUserId} (${email})`);
      }
    } else {
      // Manual flow: creates user with password, no email sent
      if (!password) {
        return new Response(JSON.stringify({ error: "Password required when not sending invite" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: name || "" },
      });

      if (createError) {
        if (createError.status === 422 && (createError as any).code === "email_exists") {
          console.log(`User ${email} already exists in auth, deleting and recreating...`);
          const { data: listData } = await supabase.auth.admin.listUsers();
          const existingUser = listData?.users?.find((u: any) => u.email === email);
          if (existingUser) {
            await supabase.auth.admin.deleteUser(existingUser.id);
          }
          const { data: retryUser, error: retryError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name: name || "" },
          });
          if (retryError) throw retryError;
          newUserId = retryUser.user.id;
          console.log(`Admin ${user.id} recreated user ${newUserId} (${email})`);
        } else {
          throw createError;
        }
      } else {
        newUserId = newUser.user.id;
        console.log(`Admin ${user.id} created user ${newUserId} (${email})`);
      }
    }

    // Grant entitlement if requested
    if (grantAccess) {
      await supabase.from("entitlements").upsert(
        { user_id: newUserId, entitlement_type: "course_app_access", active: true, source: "admin_grant" },
        { onConflict: "user_id,entitlement_type" }
      );
    }

    return new Response(JSON.stringify({ success: true, userId: newUserId }), {
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
