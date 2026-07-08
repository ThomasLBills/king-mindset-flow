/**
 * Mock auth. Replaces AuthGuard/EntitlementGuard/OnboardingGuard so the
 * whole app is navigable without a backend. Login/signup always succeed.
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

export interface MockUser {
  name: string;
  firstName: string;
  email: string;
  initials: string;
  phone?: string;
  timezone?: string;
}

export interface Covenant {
  signedName: string;
  dateISO: string;
}

interface AuthState {
  user: MockUser | null;
  why: string | null;
  covenant: Covenant | null;
  onboarded: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string) => void;
  signUp: (name: string, email: string) => void;
  signOut: () => void;
  updateProfile: (patch: { name?: string; phone?: string; timezone?: string }) => void;
  setWhy: (why: string) => void;
  sealCovenant: (signedName: string) => void;
  completeOnboarding: () => void;
}

const KEY = "lk-mock-auth-v1";

const EMPTY: AuthState = { user: null, why: null, covenant: null, onboarded: false };

const load = (): AuthState => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    /* fall through to signed-out */
  }
  return EMPTY;
};

const persist = (state: AuthState) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* demo continues in memory */
  }
};

const toUser = (name: string, email: string): MockUser => {
  const clean = name.trim() || "Brother";
  const parts = clean.split(/\s+/);
  return {
    name: clean,
    firstName: parts[0],
    email,
    initials: parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join(""),
  };
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const MockAuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>(load);

  const update = useCallback((patch: Partial<AuthState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      persist(next);
      return next;
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      // Testing mode: both sign-in and sign-up land straight on the dashboard.
      // Set onboarded: false here to bring the onboarding flow back into the path
      // (it stays reachable at /onboarding either way).
      signIn: (email) => {
        // A returning demo user keeps their profile; otherwise derive a name from the email.
        const existing = load().user;
        const local = email.split("@")[0] || "Brother";
        const derived = local.charAt(0).toUpperCase() + local.slice(1);
        update({ user: existing?.email === email ? existing : toUser(derived, email), onboarded: true });
      },
      signUp: (name, email) => update({ user: toUser(name, email), onboarded: true, why: null, covenant: null }),
      signOut: () => update({ user: null }),
      updateProfile: ({ name, phone, timezone }) => {
        if (!state.user) return;
        const renamed = name?.trim() ? toUser(name, state.user.email) : state.user;
        update({
          user: {
            ...state.user,
            ...renamed,
            phone: phone ?? state.user.phone,
            timezone: timezone ?? state.user.timezone,
          },
        });
      },
      setWhy: (why) => update({ why }),
      sealCovenant: (signedName) =>
        update({ covenant: { signedName, dateISO: new Date().toISOString() } }),
      completeOnboarding: () => update({ onboarded: true }),
    }),
    [state, update]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useMockAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useMockAuth must be used within MockAuthProvider");
  return ctx;
};

export const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { user } = useMockAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <>{children}</>;
};

export const RequireOnboarded = ({ children }: { children: ReactNode }) => {
  const { onboarded } = useMockAuth();
  if (!onboarded) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
};
