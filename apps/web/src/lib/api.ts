import 'server-only';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { SessionUser } from './types';

const API_URL = process.env.API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Server-side call to the API. Forwards the visitor's session cookie so
 * members-only and admin data is returned for signed-in users.
 */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cookieHeader = (await cookies()).toString();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      accept: 'application/json',
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      message = (await res.json()).message ?? message;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Same as api(), but a 404 renders the Next.js not-found page. */
export async function apiOr404<T>(path: string): Promise<T> {
  try {
    return await api<T>(path);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 400)) notFound();
    throw e;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  if (!jar.get('perio_session')) return null;
  try {
    return (await api<{ user: SessionUser }>('/auth/me')).user;
  } catch {
    return null;
  }
}

export function qs(params: Record<string, string | number | undefined | null>) {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') s.set(k, String(v));
  }
  const str = s.toString();
  return str ? `?${str}` : '';
}
