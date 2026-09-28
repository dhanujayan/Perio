import 'server-only';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { userFromToken } from '@/server/auth';
import { SESSION_COOKIE } from '@/server/config';
import type { SessionUser } from './types';

import * as adminArticle from '@/app/api/admin/articles/[id]/route';
import * as adminArticles from '@/app/api/admin/articles/route';
import * as adminEnquiries from '@/app/api/admin/enquiries/route';
import * as adminFaq from '@/app/api/admin/faqs/[id]/route';
import * as adminFaqs from '@/app/api/admin/faqs/route';
import * as adminMembers from '@/app/api/admin/members/route';
import * as adminQuestions from '@/app/api/admin/questions/route';
import * as adminStats from '@/app/api/admin/stats/route';
import * as article from '@/app/api/articles/[slug]/route';
import * as articles from '@/app/api/articles/route';
import * as me from '@/app/api/auth/me/route';
import * as categories from '@/app/api/categories/route';
import * as faq from '@/app/api/faqs/[slug]/route';
import * as faqs from '@/app/api/faqs/route';
import * as search from '@/app/api/search/route';
import * as sitemap from '@/app/api/sitemap/route';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type GetHandler = (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>;

// Pages read data through the same route handlers the browser and the mobile app use, called
// in-process (no network hop). Same validation, same permission checks, same JSON shape.
const ROUTES: [RegExp, string[], { GET: unknown }][] = [
  [/^\/categories$/, [], categories],
  [/^\/faqs$/, [], faqs],
  [/^\/faqs\/([^/]+)$/, ['slug'], faq],
  [/^\/articles$/, [], articles],
  [/^\/articles\/([^/]+)$/, ['slug'], article],
  [/^\/search$/, [], search],
  [/^\/sitemap$/, [], sitemap],
  [/^\/auth\/me$/, [], me],
  [/^\/admin\/stats$/, [], adminStats],
  [/^\/admin\/faqs$/, [], adminFaqs],
  [/^\/admin\/faqs\/([^/]+)$/, ['id'], adminFaq],
  [/^\/admin\/articles$/, [], adminArticles],
  [/^\/admin\/articles\/([^/]+)$/, ['id'], adminArticle],
  [/^\/admin\/questions$/, [], adminQuestions],
  [/^\/admin\/enquiries$/, [], adminEnquiries],
  [/^\/admin\/members$/, [], adminMembers],
];

/** Server-side GET of an /api path as the current visitor. */
export async function api<T>(path: string): Promise<T> {
  const url = new URL(`/api${path}`, 'http://internal');
  const route = url.pathname.slice(4);
  for (const [pattern, names, mod] of ROUTES) {
    const match = pattern.exec(route);
    if (!match) continue;
    const params = Object.fromEntries(names.map((n, i) => [n, decodeURIComponent(match[i + 1])]));
    const cookieHeader = (await cookies()).toString();
    const req = new Request(url, { headers: cookieHeader ? { cookie: cookieHeader } : {} });
    const res = await (mod.GET as GetHandler)(req, { params: Promise.resolve(params) });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(res.status, body.message ?? res.statusText);
    return body as T;
  }
  throw new Error(`No API route for ${path}`);
}

/** Same as api(), but a 404 renders the not-found page. */
export async function apiOr404<T>(path: string): Promise<T> {
  try {
    return await api<T>(path);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 400)) notFound();
    throw e;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = await userFromToken(token);
  // Dates become strings, as they would over HTTP
  return user ? (JSON.parse(JSON.stringify(user)) as SessionUser) : null;
}

export function qs(params: Record<string, string | number | undefined | null>) {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') s.set(k, String(v));
  }
  const str = s.toString();
  return str ? `?${str}` : '';
}
