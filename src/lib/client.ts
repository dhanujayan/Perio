'use client';

export interface ClientError {
  message: string;
  fields?: Record<string, string>;
}

/** Browser-side JSON call through the same-origin /api proxy. Throws ClientError. */
export async function send<T = unknown>(
  path: string,
  method: 'POST' | 'PATCH' | 'DELETE' | 'GET',
  body?: unknown,
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: body !== undefined ? { 'content-type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: ClientError = {
      message:
        res.status === 429
          ? 'Too many attempts. Wait a minute and try again.'
          : typeof data.message === 'string'
            ? data.message
            : 'Something went wrong. Try again.',
      fields: data.fields,
    };
    throw err;
  }
  return data as T;
}

export function formValues(form: HTMLFormElement): Record<string, string> {
  const out: Record<string, string> = {};
  new FormData(form).forEach((v, k) => {
    if (typeof v === 'string') out[k] = v;
  });
  return out;
}
