import { lt, sql } from 'drizzle-orm';
import { getDb } from './db';
import { clientIp, HttpError } from './http';
import { rateLimits } from './schema';

/**
 * Allows `limit` requests per IP per window for one action; throws 429 beyond that.
 * Stored in Postgres so the limit holds across serverless instances.
 */
export async function rateLimit(req: Request, action: string, limit: number, windowSeconds = 60) {
  const db = getDb();
  const windowStart = Math.floor(Date.now() / 1000 / windowSeconds) * windowSeconds;
  const key = `${action}:${clientIp(req)}:${windowStart}`;
  const expiresAt = new Date((windowStart + windowSeconds) * 1000);

  const [row] = await db
    .insert(rateLimits)
    .values({ key, count: 1, expiresAt })
    .onConflictDoUpdate({ target: rateLimits.key, set: { count: sql`${rateLimits.count} + 1` } })
    .returning({ count: rateLimits.count });

  // Occasionally clear out old windows
  if (Math.random() < 0.02) {
    void db.delete(rateLimits).where(lt(rateLimits.expiresAt, new Date())).catch(() => undefined);
  }

  if (row.count > limit) throw new HttpError(429, 'Too many attempts. Wait a minute and try again.');
}
