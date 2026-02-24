import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const searchParams = new URLSearchParams(window.location.search);

    const hasAuthParams =
      ["access_token", "refresh_token", "code", "token_hash", "type", "error", "error_code"].some(
        (key) => hashParams.has(key) || searchParams.has(key)
      );

    let settled = false;
    const settleFromSession = (nextSession: Session | null) => {
      settled = true;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      // Skip INITIAL_SESSION — we use getSession() for the initial load
      // to avoid a race where this fires with null before the persisted
      // session is fully restored, which causes a premature redirect to /login.
      if (event === 'INITIAL_SESSION') return;
      settleFromSession(nextSession);
    });

    // Primary session restore: getSession reads from localStorage.
    // On mobile Safari / PWA, localStorage may have been cleared.
    // In that case getSession returns null, but the refresh_token may
    // still be usable if the browser kept cookies. We handle that gracefully.
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!hasAuthParams || currentSession) {
        settleFromSession(currentSession);
      }
    });

    // Prevent indefinite loading for invalid/expired links where auth state event may not fire.
    const fallbackTimer = window.setTimeout(() => {
      if (!settled) {
        setLoading(false);
      }
    }, 5000);

    // When the app regains focus (user re-opens tab / PWA), proactively
    // refresh the session. This handles mobile Safari where the stored
    // session may be stale or the access token expired while backgrounded.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        supabase.auth.getSession().then(({ data: { session: freshSession } }) => {
          if (freshSession) {
            setSession(freshSession);
            setUser(freshSession.user);
          }
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearTimeout(fallbackTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      subscription.unsubscribe();
    };
  }, []);

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/app` },
    });
    return { error: error as Error | null };
  };

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, name?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: { name: name || "" },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signInWithMagicLink, signInWithPassword, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
