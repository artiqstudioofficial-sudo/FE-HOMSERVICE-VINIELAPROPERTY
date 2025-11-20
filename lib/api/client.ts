export const API_BASE_URL = 'http://localhost:4222/api/v1';

export type ApiEnvelope<T = unknown> = {
  data?: T;
  message?: string;
  [key: string]: unknown;
};

// Request mentah (kalau suatu saat butuh Response)
async function rawRequest(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${API_BASE_URL}${path}`;
  return fetch(url, {
    credentials: 'include',
    ...options,
  });
}

// Request standar yang selalu cek error + coba parse JSON
export async function apiRequest<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await rawRequest(path, options);

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request gagal: ${res.status}`);
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    // Kalau bukan JSON (misal cuma text sukses), balikin undefined
    return undefined as T;
  }

  return (await res.json()) as T;
}

// Helper khusus API yang bentuknya { data: [...] }
export async function apiArray<T = unknown>(path: string, options: RequestInit = {}): Promise<T[]> {
  const json = await apiRequest<ApiEnvelope<unknown>>(path, options);
  const rawData = json.data;
  if (!Array.isArray(rawData)) return [];
  return rawData as T[];
}

// Format Date → "YYYY-MM-DD" untuk query param schedule_date dll.
export function formatDateForApi(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Optional helper untuk bikin query string kalau nanti perlu
export function buildQuery(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');

  return qs ? `?${qs}` : '';
}
