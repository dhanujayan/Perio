import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export const badRequest = (message: string, fields?: Record<string, string>) =>
  new HttpError(400, message, fields);
export const notFound = (message = 'Not found') => new HttpError(404, message);

export function json(data: unknown, status = 200, headers?: HeadersInit) {
  return NextResponse.json(data, { status, headers });
}

export function noContent(headers?: HeadersInit) {
  return new NextResponse(null, { status: 204, headers });
}

function errorResponse(err: unknown) {
  if (err instanceof HttpError) {
    return json(
      { message: err.message, ...(err.fields ? { fields: err.fields } : {}), statusCode: err.status },
      err.status,
    );
  }
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      if (issue.code === 'unrecognized_keys') {
        for (const k of issue.keys) fields[k] ??= `${k} is not an accepted field`;
        continue;
      }
      const key = issue.path.length ? String(issue.path[0]) : '_';
      if (!fields[key]) fields[key] = issue.message;
    }
    return json({ message: 'Please check the highlighted fields', fields, statusCode: 400 }, 400);
  }
  console.error(err);
  return json({ message: 'Something went wrong. Try again.', statusCode: 500 }, 500);
}

type Ctx<P> = { params: Promise<P> };

/**
 * Wraps a route handler: turns thrown errors into JSON responses, and refuses writes that are not
 * JSON. A cross-site HTML form cannot send application/json, so together with SameSite cookies
 * this blocks CSRF.
 */
export function handler<P = Record<string, never>>(
  fn: (req: Request, params: P) => Promise<Response>,
) {
  return async (req: Request, ctx: Ctx<P>) => {
    try {
      const hasBody = Number(req.headers.get('content-length') || 0) > 0;
      const isJson = (req.headers.get('content-type') || '').toLowerCase().startsWith('application/json');
      if (req.method !== 'GET' && req.method !== 'HEAD' && hasBody && !isJson) {
        throw new HttpError(415, 'Send JSON');
      }
      return await fn(req, (await ctx?.params) ?? ({} as P));
    } catch (err) {
      return errorResponse(err);
    }
  };
}

/** Parses and validates a JSON body. Unknown fields are rejected. */
export async function readBody<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw badRequest('Send a JSON body');
  }
  return schema.parse(raw);
}

/** Validates query-string parameters. */
export function readQuery<T extends z.ZodType>(req: Request, schema: T): z.infer<T> {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  return schema.parse(params);
}

export function clientIp(req: Request): string {
  return (
    req.headers.get('x-nf-client-connection-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function assertUuid(id: string) {
  if (!UUID.test(id)) throw badRequest('Invalid id');
  return id;
}
