// Shared structured error logger for edge functions.
// Persists error events into public.system_errors so admins can review
// server-side failures beyond ephemeral console logs.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Severity = "error" | "warn" | "fatal";

export interface LogErrorOptions {
  functionName: string;
  error: unknown;
  severity?: Severity;
  userId?: string | null;
  requestId?: string | null;
  context?: Record<string, unknown>;
}

function toMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function toStack(err: unknown): string | null {
  if (err instanceof Error && err.stack) return err.stack;
  return null;
}

/**
 * Log a structured error to public.system_errors. Never throws: logging
 * failures fall back to console.error so they can't take down the caller.
 */
export async function logSystemError(opts: LogErrorOptions): Promise<void> {
  const {
    functionName,
    error,
    severity = "error",
    userId = null,
    requestId = null,
    context = {},
  } = opts;

  const message = toMessage(error);
  const stack = toStack(error);

  // Always emit to stdout for real-time debugging.
  console.error(
    `[${severity}] ${functionName}: ${message}`,
    stack ? `\n${stack}` : "",
    Object.keys(context).length ? context : "",
  );

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_KEY) return;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    await admin.from("system_errors").insert({
      function_name: functionName,
      severity,
      message: message.slice(0, 2000),
      stack: stack?.slice(0, 8000) ?? null,
      context,
      user_id: userId,
      request_id: requestId,
    });
  } catch (sinkErr) {
    // Never let logging break the caller.
    console.error("logSystemError sink failed:", sinkErr);
  }
}