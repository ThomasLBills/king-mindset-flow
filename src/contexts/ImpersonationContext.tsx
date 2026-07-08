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

export const ImpersonationProvider = ({ children }: { children: ReactNode }) => {
  const [meta, setMeta] = useState<ImpersonationMeta | null>(() => readMeta());
  const stoppingRef = useRef(false);

  const startImpersonation = useCallback(async (targetUserId: string) => {
    // 1. Snapshot current admin session BEFORE any auth swap.
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr || !sessionData.session) {
      throw new Error("You must be signed in to impersonate a user.");
    }
    const adminSession: SavedSession = {
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
    };

    // 2. Ask the edge function to mint a target session.
    const { data, error } = await supabase.functions.invoke<{
      access_token?: string;
      refresh_token?: string;
      expires_at?: number;
      target_profile?: ImpersonationTarget;
      error?: string;
    }>("admin-impersonate", {
      body: { action: "start", target_user_id: targetUserId },
    });

    if (error) {
      throw new Error(data?.error ?? error.message ?? "Impersonation failed");
    }
    if (!data?.access_token || !data?.refresh_token || !data?.target_profile) {
      throw new Error(data?.error ?? "Impersonation response missing tokens.");
    }

    // 3. Persist admin session snapshot + impersonation meta.
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminSession));
    const nextMeta: ImpersonationMeta = {
      target: data.target_profile,
      expires_at: data.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
      started_at: Math.floor(Date.now() / 1000),
    };
    localStorage.setItem(IMPERSONATION_META_KEY, JSON.stringify(nextMeta));
    setMeta(nextMeta);

    // 4. Swap the live session to the target.
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
        // Fire audit log first (while we still have a session at all).
        try {
          await supabase.functions.invoke("admin-impersonate", {
            body: {
              action: "stop",
              target_user_id: currentMeta?.target?.user_id,
            },
          });
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

  // Expiry watcher — auto-exit when the impersonation token expires.
  useEffect(() => {
    if (!meta) return;
    const msUntilExpiry = meta.expires_at * 1000 - Date.now();
    if (msUntilExpiry <= 0) {
      stopImpersonation({ silent: true });
      return;
    }
    const timer = window.setTimeout(() => {
      toast.info("Impersonation session expired.");
      stopImpersonation({ silent: true });
    }, msUntilExpiry);
    return () => window.clearTimeout(timer);
  }, [meta, stopImpersonation]);

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