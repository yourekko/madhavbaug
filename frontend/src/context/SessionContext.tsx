import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  apiRequest,
  clearStoredSession,
  getStoredToken,
  getStoredUser,
  setStoredSession,
  type ApiUser,
  type AuthPayload,
} from '../lib/api';

type SessionContextValue = {
  user: ApiUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (input: { email?: string; phone?: string; password: string }) => Promise<void>;
  signup: (input: {
    name: string;
    email?: string;
    phone?: string;
    password: string;
    signupLocation?: string;
  }) => Promise<void>;
  loginWithGoogle: (idToken: string, role: 'patient' | 'doctor') => Promise<void>;
  /** Updates token and user after profile completion or similar flows */
  replaceSession: (payload: AuthPayload) => void;
  logout: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<ApiUser | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());

  useEffect(() => {
    if (!token) return;
    apiRequest<ApiUser>('/auth/me', {}, token)
      .then((me) => {
        setUser(me);
        setStoredSession(token, me);
      })
      .catch(() => {
        setUser(null);
        setToken(null);
        clearStoredSession();
      });
  }, [token]);

  async function login(input: { email?: string; phone?: string; password: string }) {
    const payload = await apiRequest<AuthPayload>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    replaceSession(payload);
  }

  async function signup(input: {
    name: string;
    email?: string;
    phone?: string;
    password: string;
    signupLocation?: string;
  }) {
    const payload = await apiRequest<AuthPayload>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    replaceSession(payload);
  }

  async function loginWithGoogle(idToken: string, role: 'patient' | 'doctor') {
    const payload = await apiRequest<AuthPayload>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken, role }),
    });
    replaceSession(payload);
  }

  function replaceSession(payload: AuthPayload) {
    setUser(payload.user);
    setToken(payload.accessToken);
    setStoredSession(payload.accessToken, payload.user);
  }

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    clearStoredSession();
    navigate('/forum', { replace: true });
  }, [navigate]);

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!user && !!token,
      login,
      signup,
      loginWithGoogle,
      replaceSession,
      logout,
    }),
    [user, token, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
