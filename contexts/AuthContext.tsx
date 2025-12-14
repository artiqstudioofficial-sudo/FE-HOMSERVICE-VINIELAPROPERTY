import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export type UserRole = 'admin' | 'technician';

export interface CurrentUser {
  id: number;
  name: string;
  username: string;
  role: UserRole;
}

interface AuthContextType {
  currentUser: CurrentUser | null;
  isAuthLoading: boolean;
  login: (username: string, pass: string) => Promise<CurrentUser | null>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<CurrentUser | null>;
}

/* -------------------------------------------------------------------------- */
/*                                  CONFIG                                    */
/* -------------------------------------------------------------------------- */

const API_BASE_URL = (import.meta as any)?.env?.VITE_API_BASE_URL || 'http://localhost:4333';

// Sesuaikan sama route backend kamu
const AUTH_ENDPOINTS = {
  login: `${API_BASE_URL}/api/v1/admin/login`,
  logout: `${API_BASE_URL}/api/v1/admin/logout`,
  me: `${API_BASE_URL}/api/v1/admin/me`,
};

/* -------------------------------------------------------------------------- */
/*                               API HELPERS                                  */
/* -------------------------------------------------------------------------- */

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    credentials: 'include', // <— penting untuk session cookie
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = json?.message || json?.error || `Request gagal (status ${res.status})`;
    throw new Error(msg);
  }

  return json as T;
}

/**
 * Response standar backend kamu biasanya:
 * misc.response(res, code, error, message, data)
 * -> { error:boolean, message:string, data:any }
 */
type ApiEnvelope<T> = {
  error?: boolean;
  message?: string;
  data?: T;
};

/* -------------------------------------------------------------------------- */
/*                         AUTH API (login/me/logout)                         */
/* -------------------------------------------------------------------------- */

async function authLoginApi(username: string, password: string): Promise<CurrentUser> {
  // body sesuai backend kamu
  const body = JSON.stringify({ username, password });

  const resp = await apiFetch<ApiEnvelope<any>>(AUTH_ENDPOINTS.login, {
    method: 'POST',
    body,
  });

  // backend boleh mengembalikan data user di resp.data
  // kalau tidak, kita fallback ke authMeApi
  const user = resp?.data;

  if (user?.id) {
    return normalizeUser(user);
  }

  // fallback
  return await authMeApi();
}

async function authMeApi(): Promise<CurrentUser> {
  const resp = await apiFetch<ApiEnvelope<any>>(AUTH_ENDPOINTS.me, {
    method: 'GET',
  });

  if (!resp?.data) throw new Error('Session tidak valid / belum login.');
  return normalizeUser(resp.data);
}

async function authLogoutApi(): Promise<void> {
  await apiFetch<ApiEnvelope<any>>(AUTH_ENDPOINTS.logout, {
    method: 'POST',
  });
}

/* -------------------------------------------------------------------------- */
/*                           NORMALIZE USER PAYLOAD                            */
/* -------------------------------------------------------------------------- */

function normalizeUser(raw: any): CurrentUser {
  // support beberapa bentuk field yang umum muncul dari backend
  // contoh: fullname/name/username/role
  const id = Number(raw.id);
  const name = String(raw.name ?? raw.fullname ?? raw.full_name ?? '');
  const username = String(raw.username ?? '');
  const role = String(raw.role ?? raw.role_name ?? '').toLowerCase();

  // mapping role bebas: "technician"/"admin"
  const normalizedRole: UserRole = role === 'technician' ? 'technician' : 'admin';

  if (!id || !username) {
    throw new Error('Response user tidak valid dari server (id/username kosong).');
  }

  return { id, name: name || username, username, role: normalizedRole };
}

/* -------------------------------------------------------------------------- */
/*                                CONTEXT                                     */
/* -------------------------------------------------------------------------- */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const refreshMe = async (): Promise<CurrentUser | null> => {
    try {
      const me = await authMeApi();
      setCurrentUser(me);
      return me;
    } catch (err) {
      // kalau belum login / session expired, biarin null
      setCurrentUser(null);
      return null;
    }
  };

  useEffect(() => {
    // cek session saat app pertama kali jalan / refresh browser
    (async () => {
      setIsAuthLoading(true);
      await refreshMe();
      setIsAuthLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (username: string, pass: string): Promise<CurrentUser | null> => {
    try {
      const user = await authLoginApi(username, pass);
      setCurrentUser(user);
      return user;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const logout = async () => {
    try {
      await authLogoutApi();
    } catch (err) {
      // walau gagal logout (misal session sudah habis), tetap bersihin state FE
      console.warn('logout api failed:', err);
    } finally {
      setCurrentUser(null);
      navigate('/');
    }
  };

  const value = useMemo<AuthContextType>(
    () => ({
      currentUser,
      isAuthLoading,
      login,
      logout,
      refreshMe,
    }),
    [currentUser, isAuthLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
