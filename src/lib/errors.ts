const GENERIC = "Something went wrong. Please try again.";
const OFFLINE = "You appear to be offline. Check your connection and try again.";

type MaybeErr = { code?: string; message?: string; name?: string; status?: number };

function isNetworkError(e: MaybeErr): boolean {
  const msg = (e.message ?? "").toLowerCase();
  return (
    e instanceof TypeError ||
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    (typeof navigator !== "undefined" && navigator.onLine === false)
  );
}

/** Turn a Supabase/PostgREST/network error into a human message. Always logs the raw error. */
export function mapSupabaseError(error: unknown): string {
  console.error("[supabase error]", error);
  const e = (error ?? {}) as MaybeErr;

  if (isNetworkError(e)) return OFFLINE;

  switch (e.code) {
    case "23505":
      return "This already exists.";
    case "23503":
      return "That refers to something that no longer exists.";
    case "23514":
      return "That value isn't allowed.";
    case "42501":
      return "You don't have permission to do that.";
  }
  if ((e.message ?? "").toLowerCase().includes("row-level security"))
    return "You don't have permission to do that.";

  // Supabase auth errors carry user-safe messages.
  if (e.name === "AuthApiError" && e.message) return e.message;

  return GENERIC;
}
