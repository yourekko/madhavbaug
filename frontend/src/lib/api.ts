export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';

export type ApiUser = {
  id: string;
  name: string;
  role: 'patient' | 'doctor' | 'admin' | 'superadmin';
  email: string | null;
  phone: string | null;
  needsPatientPhone?: boolean;
  needsDoctorProfile?: boolean;
};

export type AuthPayload = {
  accessToken: string;
  user: ApiUser;
};

type ApiError = {
  message?: string | string[];
};

async function parseJsonSafe(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function apiUploadImage(path: string, file: File, token: string): Promise<{ url: string }> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: fd,
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    const err = body as ApiError | null;
    const msg = Array.isArray(err?.message) ? err?.message[0] : err?.message;
    throw new Error(msg ?? 'Upload failed');
  }
  return body as { url: string };
}

export async function apiUploadPublicImage(path: string, file: File): Promise<{ url: string }> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    body: fd,
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    const err = body as ApiError | null;
    const msg = Array.isArray(err?.message) ? err?.message[0] : err?.message;
    throw new Error(msg ?? 'Upload failed');
  }
  return body as { url: string };
}

export async function apiRequest<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    const err = body as ApiError | null;
    const msg = Array.isArray(err?.message) ? err?.message[0] : err?.message;
    throw new Error(msg ?? 'Request failed');
  }
  return body as T;
}

export function getStoredToken() {
  return localStorage.getItem('mb_access_token');
}

export function setStoredSession(token: string, user: ApiUser) {
  localStorage.setItem('mb_access_token', token);
  localStorage.setItem('mb_user', JSON.stringify(user));
}

export function getStoredUser(): ApiUser | null {
  const raw = localStorage.getItem('mb_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ApiUser;
  } catch {
    return null;
  }
}

export function clearStoredSession() {
  localStorage.removeItem('mb_access_token');
  localStorage.removeItem('mb_user');
}
