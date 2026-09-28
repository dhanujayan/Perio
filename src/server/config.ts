/**
 * Server settings from environment variables.
 *
 * Database: Netlify Database sets NETLIFY_DB_URL automatically. Anywhere else (local, Neon, RDS),
 * set DATABASE_URL.
 */
export function databaseUrl(): string {
  const url = process.env.NETLIFY_DB_URL || process.env.DATABASE_URL;
  if (!url) throw new Error('No database configured: set DATABASE_URL (or use Netlify Database)');
  return url;
}

let cachedSecret: Uint8Array | null = null;

export function jwtSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || secret === 'change-me') {
    throw new Error('JWT_SECRET must be set to a random string of at least 32 characters');
  }
  cachedSecret = new TextEncoder().encode(secret);
  return cachedSecret;
}

export const SESSION_COOKIE = 'perio_session';
export const SESSION_DAYS = 7;

/** Secure cookies whenever the site runs on HTTPS (always true on Netlify). */
export function cookieSecure(): boolean {
  if (process.env.COOKIE_SECURE) return process.env.COOKIE_SECURE === 'true';
  return (process.env.SITE_URL || process.env.URL || '').startsWith('https://');
}
