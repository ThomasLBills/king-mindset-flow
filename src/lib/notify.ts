import { toast } from "sonner";
import { mapSupabaseError } from "./errors";

type NotifyOpts = { description?: string; duration?: number };

// sonner's Toaster renders an aria-live="polite" region by default, so call-sites
// don't set live-region props. Per 2026 a11y guidance: success may auto-dismiss,
// but ERROR toasts persist until the user dismisses them so they aren't missed —
// and critical/actionable errors must also appear inline/banner, never toast-only.
export const notify = {
  success: (message: string, opts?: NotifyOpts) => toast.success(message, { ...opts }),
  error: (message: string, opts?: NotifyOpts) => toast.error(message, { duration: Infinity, ...opts }),
  info: (message: string, opts?: NotifyOpts) => toast(message, { ...opts }),
  /** Map a thrown Supabase/network error to copy and toast it. */
  fromError: (error: unknown, fallback?: string) => {
    const msg = mapSupabaseError(error);
    return toast.error(fallback ?? msg, { duration: Infinity });
  },
};
