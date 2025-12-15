// src/lib/api/client.ts
// Client helper standar: apiRequest + apiArray + baseURL
// Support cookies session -> credentials: 'include'

// Production https://api-homeservice.viniela.id
// Localhost http://localhost:4333

export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || 'https://api-homeservice.viniela.id';

type ApiRequestInit = RequestInit & {
  // kalau kamu butuh override baseUrl per call
  baseUrl?: string;
};

export function formatDateForApi(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildUrl(path: string, baseUrl?: string) {
  // path bisa sudah full URL
  if (/^https?:\/\//i.test(path)) return path;
  const base = (baseUrl ?? API_BASE_URL).replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export async function apiRequest<T = any>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const url = buildUrl(path, init.baseUrl);

  const res = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.headers || {}),
    },
  });

  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const msg =
      (payload && (payload.message || payload.error)) ||
      `Request gagal (${res.status}) ${res.statusText}`;
    throw new Error(msg);
  }

  return payload as T;
}

/**
 * Helper untuk endpoint yang mengembalikan array:
 * - { data: [] }
 * - { data: { rows: [] } }
 * - []
 */
export async function apiArray<T = any>(path: string): Promise<T[]> {
  const res: any = await apiRequest(path, { method: 'GET' });

  if (Array.isArray(res)) return res as T[];
  if (Array.isArray(res?.data)) return res.data as T[];
  if (Array.isArray(res?.data?.rows)) return res.data.rows as T[];

  // fallback aman
  return [];
}
