import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ADMIN_SESSION_KEY = "lk_admin_pre_impersonation";
const IMPERSONATION_META_KEY = "lk_impersonation_meta";

type SavedSession = {
  access_token: string;
  refresh_token: string;
};

export type ImpersonationTarget = {
  user_id: string;
  email: string;
  display_name: string | null;
  first_name: string | null;
  avatar_url: string | null;
};

type ImpersonationMeta = {
  target: ImpersonationTarget;
  expires_at: number; // seconds since epoch
  started_at: number;
};

type ImpersonationContextValue = {
  isImpersonating: boolean;
  target: ImpersonationTarget | null;
  expiresAt: number | null;
  startImpersonation: (targetUserId: string) => Promise<void>;
  stopImpersonation: (opts?: { silent?: boolean }) => Promise<void>;
};

const ImpersonationContext = createContext<ImpersonationContextValue | undefined>(undefined);

const readMeta = (): ImpersonationMeta | null => {
  try {
    const raw = localStorage.getItem(IMPERSONATION_META_KEY);
    return raw ? (JSON.parse(raw) as ImpersonationMeta) : null;
  } catch {
    return null;
  }
};

const readAdminSnapshot = (): SavedSession | null => {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    return raw ? (JSON.parse(raw) as SavedSession) : null;
  } catch {
    return null;
  }
};

// supabase.functions.invoke throws a FunctionsHttpError on non-2xx that hides
// the response body behind `error.context` (a Response). Extract the JSON
// error message from the edge function so toasts show the real reason.
const extractInvokeError = async (
  error: unknown,
  fallback = "Impersonation failed",
): Promise<string> => {
  try {
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.clone === "function") {
      const body = await ctx.clone().json().catch(() => null);
      if (body?.error && typeof body.error === "string") return body.error;
    }
  } catch {
    // ignore — fall through to message
  }
  const msg = (error as { message?: string })?.message;
  return msg && msg !== "Edge Function returned a non-2xx status code" ? msg : fallback;
};

export const ImpersonationProvider = ({ children }: { children: ReactNode }) => {
  const [meta, setMeta] = useState<ImpersonationMeta | null>(() => readMeta());
  const stoppingRef = useRef(false);

  const startImpersonation = useCallback(async (targetUserId: string) => {
    // 1. If we already have an admin snapshot (from a prior impersonation
    //    that may not have fully cleaned up), restore it first so we're
    //    guaranteed to call the edge function AS the admin, not as a
    //    previously-impersonated user.
    const existingSnapshot = readAdminSnapshot();
    if (existingSnapshot) {
      await supabase.auth.setSession({
        access_token: existingSnapshot.access_token,
        refresh_token: existingSnapshot.refresh_token,
      }).catch(() => {
        // If restore fails, fall through and try with whatever the current
        // session is; the edge function will 403 and we'll surface it.
      });
    }

    // 2. Force a token refresh so we send a guaranteed-fresh admin JWT.
    //    A stale/expired token in localStorage is the usual cause of 401.
    let { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session?.refresh_token) {
      const { data: refreshed } = await supabase.auth.refreshSession({
        refresh_token: sessionData.session.refresh_token,
      });
      if (refreshed?.session) sessionData = { session: refreshed.session } as typeof sessionData;
    }
    if (!sessionData.session) {
      throw new Error("You must be signed in to impersonate a user.");
    }
    const adminSession: SavedSession = {
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
    };

    // 3. Call the edge function via direct fetch so we can explicitly send
    //    the fresh admin bearer token (invoke can send a stale one).
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
    const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-impersonate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${adminSession.access_token}`,
      },
      body: JSON.stringify({ action: "start", target_user_id: targetUserId }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      access_token?: string;
      refresh_token?: string;
      expires_at?: number;
      target_profile?: ImpersonationTarget;
      error?: string;
    };
    if (!res.ok) {
      throw new Error(data?.error ?? `Impersonation failed (${res.status})`);
    }
    if (!data?.access_token || !data?.refresh_token || !data?.target_profile) {
      throw new Error(data?.error ?? "Impersonation response missing tokens.");
    }

    // 4. Persist admin session snapshot + impersonation meta.
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminSession));
    const nextMeta: ImpersonationMeta = {
      target: data.target_profile,
      expires_at: data.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
      started_at: Math.floor(Date.now() / 1000),
    };
    localStorage.setItem(IMPERSONATION_META_KEY, JSON.stringify(nextMeta));
    setMeta(nextMeta);

    // 5. Swap the live session to the target.
    const { error: setErr } = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });
    if (setErr) {
      // Roll back
      localStorage.removeItem(ADMIN_SESSION_KEY);
      localStorage.removeItem(IMPERSONATION_META_KEY);
      setMeta(null);
      throw new Error(setErr.message);
    }
  }, []);

  const stopImpersonation = useCallback(
    async ({ silent }: { silent?: boolean } = {}) => {
      if (stoppingRef.current) return;
      stoppingRef.current = true;
      try {
        const savedRaw = localStorage.getItem(ADMIN_SESSION_KEY);
        const currentMeta = readMeta();
        // Fire audit log first — use the SAVED ADMIN token explicitly,
        // because the live session is currently the impersonated (non-admin)
        // user and would be rejected as Forbidden by the edge function.
        try {
          const savedAdmin = savedRaw ? (JSON.parse(savedRaw) as SavedSession) : null;
          if (savedAdmin?.access_token) {
            await supabase.functions.invoke("admin-impersonate", {
              body: {
                action: "stop",
                target_user_id: currentMeta?.target?.user_id,
              },
              headers: {
                Authorization: `Bearer ${savedAdmin.access_token}`,
              },
            });
          }
        } catch {
          // best-effort
        }

        localStorage.removeItem(ADMIN_SESSION_KEY);
        localStorage.removeItem(IMPERSONATION_META_KEY);
        setMeta(null);

        if (savedRaw) {
          try {
            const saved = JSON.parse(savedRaw) as SavedSession;
            const { error } = await supabase.auth.setSession(saved);
            if (error) {
              await supabase.auth.signOut();
              if (!silent) toast.error("Session restore failed. Please sign in again.");
              window.location.href = "/login";
              return;
            }
          } catch {
            await supabase.auth.signOut();
            window.location.href = "/login";
            return;
          }
        } else {
          await supabase.auth.signOut();
          window.location.href = "/login";
          return;
        }

        if (!silent && currentMeta) {
          toast.success(
            `Exited impersonation of ${currentMeta.target.display_name ?? currentMeta.target.email}`,
          );
        }
      } finally {
        stoppingRef.current = false;
      }
    },
    [],
  );

  // No client-side expiry: admin sessions last until the admin clicks Exit.
  // The Supabase client auto-refreshes the impersonated session's tokens.

  // Cross-tab sync: if another tab starts/stops, reflect it here.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === IMPERSONATION_META_KEY) {
        setMeta(readMeta());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo<ImpersonationContextValue>(
    () => ({
      isImpersonating: !!meta,
      target: meta?.target ?? null,
      expiresAt: meta?.expires_at ?? null,
      startImpersonation,
      stopImpersonation,
    }),
    [meta, startImpersonation, stopImpersonation],
  );

  return (
    <ImpersonationContext.Provider value={value}>{children}</ImpersonationContext.Provider>
  );
};

export const useImpersonation = () => {
  const ctx = useContext(ImpersonationContext);
  if (!ctx) throw new Error("useImpersonation must be used inside ImpersonationProvider");
  return ctx;
};

export const useIsImpersonating = () => useImpersonation().isImpersonating;