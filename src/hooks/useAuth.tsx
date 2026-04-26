import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
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
      if (event === 'INITIAL_SESSION') return;
      settleFromSession(nextSession);
    });

    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      // If we have a session but the access token is expired or near expiry, refresh it
      // so subsequent REST calls include a valid JWT (otherwise supabase-js falls back to
      // the anon key, causing RLS-protected queries to silently return 0 rows).
      let effectiveSession = currentSession;
      if (currentSession?.expires_at) {
        const nowSec = Math.floor(Date.now() / 1000);
        if (currentSession.expires_at <= nowSec + 30) {
          const { data: refreshed } = await supabase.auth.refreshSession();
          if (refreshed.session) effectiveSession = refreshed.session;
        }
      }
      if (!hasAuthParams || effectiveSession) {
        settleFromSession(effectiveSession);
      }
    });

    const fallbackTimer = window.setTimeout(() => {
      if (!settled) {
        setLoading(false);
      }
    }, 5000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        supabase.auth.getSession().then(async ({ data: { session: freshSession } }) => {
          let next = freshSession;
          if (freshSession?.expires_at) {
            const nowSec = Math.floor(Date.now() / 1000);
            if (freshSession.expires_at <= nowSec + 30) {
              const { data: refreshed } = await supabase.auth.refreshSession();
              if (refreshed.session) next = refreshed.session;
            }
          }
          if (next) {
            setSession(next);
            setUser(next.user);
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
    <AuthContext.Provider value={{ session, user, loading, signInWithPassword, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
