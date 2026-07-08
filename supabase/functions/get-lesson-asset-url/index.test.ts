import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const FN_URL = `${SUPABASE_URL}/functions/v1/get-lesson-asset-url`;
const BUCKET = "curriculum-files";

// Guard: if no service role is available in the runtime, skip all E2E tests
// with a clear message rather than crashing.
const canRunE2E = !!SERVICE_KEY && !!SUPABASE_URL && !!ANON_KEY;

// Emit a one-time diagnostic so a skipped run is easy to explain.
if (!canRunE2E) {
  const missing = [
    !SUPABASE_URL && "SUPABASE_URL",
    !ANON_KEY && "SUPABASE_ANON_KEY / VITE_SUPABASE_PUBLISHABLE_KEY",
    !SERVICE_KEY && "SUPABASE_SERVICE_ROLE_KEY",
  ].filter(Boolean).join(", ");
  console.warn(
    `[get-lesson-asset-url E2E] Skipping — missing env: ${missing}. ` +
      `Provide these to the test runner to enable the live tests.`,
  );
}

type Ctx = {
  userEmail: string;
  userPassword: string;
  userId: string;
  userJwt: string;
  publishedLessonId: string;
  draftLessonId: string;
  storagePath: string;
};

async function setup(): Promise<Ctx> {
  const admin = createClient(SUPABASE_URL, SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const suffix = crypto.randomUUID().slice(0, 8);
  const userEmail = `qa-signed-${suffix}@qa.liberatedkings.test`;
  const userPassword = `Qq1!${crypto.randomUUID()}`;

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: userEmail,
    password: userPassword,
    email_confirm: true,
  });
  if (createErr || !created?.user) throw new Error(`createUser: ${createErr?.message}`);
  const userId = created.user.id;

  // Grant active entitlement (upsert — handle_new_user trigger may have seeded a trial row already)
  const { error: entErr } = await admin
    .from("entitlements")
    .upsert(
      {
        user_id: userId,
        entitlement_type: "course_app_access",
        active: true,
        source: "manual",
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
      { onConflict: "user_id,entitlement_type" },
    );
  if (entErr) throw new Error(`entitlement: ${entErr.message}`);

  // Sign in for JWT
  const anonClient = createClient(SUPABASE_URL, ANON_KEY);
  const { data: signIn, error: signErr } = await anonClient.auth.signInWithPassword({
    email: userEmail,
    password: userPassword,
  });
  if (signErr || !signIn?.session) throw new Error(`signIn: ${signErr?.message}`);
  const userJwt = signIn.session.access_token;

  // Ensure at least one published lesson exists
  const { data: pub, error: pubErr } = await admin
    .from("curriculum_lessons")
    .select("id")
    .eq("status", "published")
    .limit(1)
    .maybeSingle();
  if (pubErr || !pub) throw new Error(`no published lesson: ${pubErr?.message}`);
  const publishedLessonId = pub.id as string;

  // Create a draft lesson for the 403 test
  const { data: draft, error: draftErr } = await admin
    .from("curriculum_lessons")
    .insert({ title: `QA draft ${suffix}`, status: "draft" })
    .select("id")
    .single();
  if (draftErr || !draft) throw new Error(`draft: ${draftErr?.message}`);
  const draftLessonId = draft.id as string;

  // Upload a tiny test asset the QA user is allowed to fetch
  const storagePath = `files/qa-${suffix}/probe.txt`;
  const bytes = new TextEncoder().encode(`qa-probe-${suffix}`);
  const { error: upErr } = await admin.storage.from(BUCKET).upload(storagePath, bytes, {
    contentType: "text/plain",
    upsert: true,
  });
  if (upErr) throw new Error(`upload: ${upErr.message}`);

  return { userEmail, userPassword, userId, userJwt, publishedLessonId, draftLessonId, storagePath };
}

async function teardown(ctx: Ctx) {
  const admin = createClient(SUPABASE_URL, SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  try { await admin.storage.from(BUCKET).remove([ctx.storagePath]); } catch { /* ignore */ }
  try { await admin.from("curriculum_lessons").delete().eq("id", ctx.draftLessonId); } catch { /* ignore */ }
  try { await admin.from("edge_rate_limits").delete().eq("user_id", ctx.userId); } catch { /* ignore */ }
  try { await admin.auth.admin.deleteUser(ctx.userId); } catch { /* ignore */ }
}

async function callFn(
  jwt: string | null,
  body: Record<string, unknown>,
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: ANON_KEY,
  };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  return await fetch(FN_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

Deno.test({
  name: "get-lesson-asset-url E2E",
  ignore: !canRunE2E,
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    if (!canRunE2E) return;
    const ctx = await setup();

    try {
      await t.step("authorized user gets a working signed URL", async () => {
        const res = await callFn(ctx.userJwt, {
          path: ctx.storagePath,
          lessonId: ctx.publishedLessonId,
        });
        assertEquals(res.status, 200, `expected 200 got ${res.status}`);
        const body = await res.json();
        assert(typeof body.url === "string" && body.url.length > 0, "url missing");
        assert(typeof body.expiresAt === "string", "expiresAt missing");

        // Signed URL must actually download the file
        const download = await fetch(body.url);
        assertEquals(download.status, 200, "signed URL did not download");
        const text = await download.text();
        assert(text.startsWith("qa-probe-"), `unexpected file contents: ${text.slice(0, 40)}`);
      });

      await t.step("draft lesson returns 403 for non-admin", async () => {
        const res = await callFn(ctx.userJwt, {
          path: ctx.storagePath,
          lessonId: ctx.draftLessonId,
        });
        assertEquals(res.status, 403, `expected 403 got ${res.status}`);
        await res.body?.cancel();
      });

      await t.step("rate limit returns 429 with a valid Retry-After header", async () => {
        // Clear any counters the earlier steps accrued for this window
        const admin = createClient(SUPABASE_URL, SERVICE_KEY!, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        await admin.from("edge_rate_limits").delete().eq("user_id", ctx.userId);

        // Burst: 60 succeed, 61st should be 429
        let last: Response | null = null;
        for (let i = 0; i < 61; i++) {
          last = await callFn(ctx.userJwt, {
            path: ctx.storagePath,
            lessonId: ctx.publishedLessonId,
          });
          if (last.status === 429) break;
          await last.body?.cancel();
        }
        assert(last, "no responses recorded");
        assertEquals(last!.status, 429, `expected 429 eventually, got ${last!.status}`);
        const retryAfter = last!.headers.get("Retry-After");
        assert(retryAfter, "Retry-After header missing");
        const seconds = Number(retryAfter);
        assert(Number.isFinite(seconds), `Retry-After not numeric: ${retryAfter}`);
        assert(seconds > 0 && seconds <= 600, `Retry-After out of range: ${seconds}`);
        await last!.body?.cancel();
      });
    } finally {
      await teardown(ctx);
    }
  },
});