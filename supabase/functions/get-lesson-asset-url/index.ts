import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const BUCKET = "curriculum-files";
const DEFAULT_TTL_SECONDS = 600; // 10 min
const MIN_TTL_SECONDS = 1;
const MAX_TTL_SECONDS = 600;
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 min
const ALLOWED_PREFIXES = ["videos/", "audios/", "files/", "images/"];

// Privacy-safe logger: no paths, no URLs, no filenames.
function safeLog(
  outcome: string,
  ctx: { userId?: string; lessonId?: string; extra?: Record<string, unknown> },
) {
  const payload: Record<string, unknown> = { outcome };
  if (ctx.userId) payload.user_id = ctx.userId;
  if (ctx.lessonId) payload.lesson_id = ctx.lessonId;
  if (ctx.extra) Object.assign(payload, ctx.extra);
  console.log(JSON.stringify(payload));
}

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function validPath(path: unknown): path is string {
  if (typeof path !== "string" || path.length === 0 || path.length > 512) return false;
  if (path.includes("..") || path.startsWith("/") || path.includes("\\")) return false;
  return ALLOWED_PREFIXES.some((p) => path.startsWith(p));
}

function validUuid(v: unknown): v is string {
  return typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    safeLog("unauthorized_missing_bearer", {});
    return json(401, { error: "Unauthorized" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.slice("Bearer ".length);
  const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
  if (claimsError || !claimsData?.claims?.sub) {
    safeLog("unauthorized_invalid_jwt", {});
    return json(401, { error: "Unauthorized" });
  }
  const userId = claimsData.claims.sub as string;

  // Parse + validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    safeLog("bad_request_json_parse", { userId });
    return json(400, { error: "Invalid JSON body" });
  }
  const { path, lessonId, ttlSeconds } = (body ?? {}) as {
    path?: unknown;
    lessonId?: unknown;
    ttlSeconds?: unknown;
  };
  if (!validPath(path)) {
    safeLog("bad_request_invalid_path", { userId });
    return json(400, { error: "Invalid path" });
  }
  if (!validUuid(lessonId)) {
    safeLog("bad_request_invalid_lesson", { userId });
    return json(400, { error: "Invalid lessonId" });
  }
  let ttl = DEFAULT_TTL_SECONDS;
  if (ttlSeconds !== undefined) {
    if (typeof ttlSeconds !== "number" || !Number.isFinite(ttlSeconds)) {
      safeLog("bad_request_invalid_ttl", { userId });
      return json(400, { error: "Invalid ttlSeconds" });
    }
    ttl = Math.min(MAX_TTL_SECONDS, Math.max(MIN_TTL_SECONDS, Math.floor(ttlSeconds)));
  }

  const service = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Rate limit: fixed 10-min window
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS)
    .toISOString();
  const { data: bumpData, error: bumpError } = await service.rpc("bump_rate_limit", {
    _user_id: userId,
    _bucket_key: "get-lesson-asset-url",
    _window_start: windowStart,
  });
  if (bumpError) {
    safeLog("rate_limit_error", { userId, extra: { code: bumpError.code } });
    return json(500, { error: "Internal error" });
  }
  const count = typeof bumpData === "number" ? bumpData : Number(bumpData);
  if (count > RATE_LIMIT_MAX) {
    safeLog("rate_limited", { userId, lessonId: lessonId as string, extra: { count } });
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded" }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": String(
            Math.ceil(
              (Math.floor(now / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS +
                RATE_LIMIT_WINDOW_MS - now) / 1000,
            ),
          ),
        },
      },
    );
  }

  // Authorization: admin OR active entitlement
  const [{ data: isAdmin }, { data: hasEnt }] = await Promise.all([
    service.rpc("has_role", { _user_id: userId, _role: "admin" }),
    service.rpc("has_active_entitlement", {
      _user_id: userId,
      _type: "course_app_access",
    }),
  ]);
  if (!isAdmin && !hasEnt) {
    safeLog("forbidden_no_entitlement", { userId, lessonId: lessonId as string });
    return json(403, { error: "Forbidden" });
  }

  // Confirm the requested lesson is published (admins may access drafts too)
  const lessonQuery = service.from("curriculum_lessons").select("id,status").eq("id", lessonId).maybeSingle();
  const { data: lesson, error: lessonError } = await lessonQuery;
  if (lessonError) {
    safeLog("lesson_lookup_error", { userId, lessonId: lessonId as string });
    return json(500, { error: "Internal error" });
  }
  if (!lesson) {
    safeLog("lesson_not_found", { userId, lessonId: lessonId as string });
    return json(404, { error: "Lesson not found" });
  }
  if (lesson.status !== "published" && !isAdmin) {
    safeLog("forbidden_lesson_not_published", { userId, lessonId: lessonId as string });
    return json(403, { error: "Forbidden" });
  }

  // Mint signed URL
  const { data: signed, error: signError } = await service.storage
    .from(BUCKET)
    .createSignedUrl(path as string, ttl);
  if (signError || !signed?.signedUrl) {
    safeLog("sign_error", { userId, lessonId: lessonId as string });
    return json(500, { error: "Could not sign asset" });
  }

  safeLog("signed_ok", {
    userId,
    lessonId: lessonId as string,
    extra: { admin: !!isAdmin, count, ttl },
  });

  return json(200, {
    url: signed.signedUrl,
    expiresAt: new Date(now + ttl * 1000).toISOString(),
    ttlSeconds: ttl,
  });
});