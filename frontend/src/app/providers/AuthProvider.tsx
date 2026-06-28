import { createContext, useContext } from "react";
import { startTransition, useEffect, useMemo, useState } from "react";

import { getActivationStatus, getMe, login, type AuthUser } from "../api/auth";
import { ApiError } from "../api/client";

type SessionState = {
  token: string;
  branchId: number;
  user: AuthUser;
};

type AuthContextValue = {
  session: SessionState | null;
  activationRequired: boolean;
  loading: boolean;
  error: string | null;
  signIn: (pin: string, branchId: number) => Promise<void>;
  signOut: () => void;
};

const STORAGE_KEY = "nima_frontend_session";
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activationRequired, setActivationRequired] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const activation = await getActivationStatus();
        setActivationRequired(!activation.is_active);

        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          setLoading(false);
          return;
        }

        const parsed = JSON.parse(raw) as SessionState;
        const me = await getMe(parsed.token);

        startTransition(() => {
          setSession({
            token: parsed.token,
            branchId: me.branch_id,
            user: {
              id: me.user_id,
              username: me.username,
              role: me.role
            }
          });
        });
      } catch (caught) {
        localStorage.removeItem(STORAGE_KEY);
        setSession(null);
        setError(caught instanceof Error ? caught.message : "Failed to initialize session");
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      activationRequired,
      loading,
      error,
      signIn: async (pin: string, branchId: number) => {
        setError(null);
        const result = await login({ pin, branch_id: branchId });
        const nextSession: SessionState = {
          token: result.token,
          branchId,
          user: result.user
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
        startTransition(() => {
          setSession(nextSession);
        });
      },
      signOut: () => {
        localStorage.removeItem(STORAGE_KEY);
        setSession(null);
      }
    }),
    [activationRequired, error, loading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

export function getReadableAuthError(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "حدث خطأ غير متوقع أثناء تسجيل الدخول";
}
