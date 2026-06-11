import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AuthAPI, clearTokens, loadTokens, saveTokens } from "../lib/api";
import type { TokenPair, User } from "../lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
  isSeller: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, phone: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const refreshUser = useCallback(async () => {
    if (!loadTokens()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      setUser(await AuthAPI.profile());
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Fired by the API client when a token refresh fails.
  useEffect(() => {
    const onForcedLogout = () => {
      setUser(null);
      queryClient.removeQueries({ queryKey: ["cart"] });
    };
    window.addEventListener("verso:logout", onForcedLogout);
    return () => window.removeEventListener("verso:logout", onForcedLogout);
  }, [queryClient]);

  const acceptTokens = useCallback(
    async (pair: TokenPair) => {
      saveTokens(pair);
      setUser(await AuthAPI.profile());
      queryClient.invalidateQueries();
    },
    [queryClient],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      await acceptTokens(await AuthAPI.login({ email, password }));
    },
    [acceptTokens],
  );

  const register = useCallback(
    async (email: string, password: string, phone: string) => {
      await acceptTokens(await AuthAPI.register({ email, password, phone }));
    },
    [acceptTokens],
  );

  const finishLogout = useCallback(() => {
    clearTokens();
    setUser(null);
    queryClient.removeQueries({ queryKey: ["cart"] });
    queryClient.removeQueries({ queryKey: ["orders"] });
    queryClient.removeQueries({ queryKey: ["addresses"] });
  }, [queryClient]);

  const logout = useCallback(async () => {
    try {
      await AuthAPI.logout();
    } catch {
      // Token may already be expired; local logout proceeds regardless.
    }
    finishLogout();
  }, [finishLogout]);

  const logoutAll = useCallback(async () => {
    try {
      await AuthAPI.logoutAll();
    } catch {
      // Same as logout: never strand the user in a half-authenticated state.
    }
    finishLogout();
  }, [finishLogout]);

  const value = useMemo(
    () => ({
      user,
      loading,
      authenticated: !!user,
      isSeller: user?.user_type === "seller",
      login,
      register,
      logout,
      logoutAll,
      refreshUser,
    }),
    [user, loading, login, register, logout, logoutAll, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
