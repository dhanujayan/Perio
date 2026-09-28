import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { jwtVerify, SignJWT } from 'jose';
import { cookieSecure, jwtSecret, SESSION_COOKIE, SESSION_DAYS } from './config';
import { getDb } from './db';
import { HttpError } from './http';
import { users, type Role, type User } from './schema';

const BCRYPT_ROUNDS = 12;
// Compared against when the email is unknown, so a login takes the same time either way
const DUMMY_HASH = '$2b$12$Aqj7klT1Up9O6KU9hQ7/VOu3rOnJ1fQaz2XZnumQK8yC6.PgBHtU6';

/** The signed-in user. Never includes the password hash. */
export type SessionUser = Pick<
  User,
  'id' | 'email' | 'name' | 'role' | 'phone' | 'city' | 'registrationNo' | 'isStudent' | 'createdAt'
>;

export function toSessionUser(u: User): SessionUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    phone: u.phone,
    city: u.city,
    registrationNo: u.registrationNo,
    isStudent: u.isStudent,
    createdAt: u.createdAt,
  };
}

export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_ROUNDS);

export async function checkPassword(password: string, hash: string | undefined) {
  return bcrypt.compare(password, hash ?? DUMMY_HASH);
}

export function signSession(user: SessionUser) {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(jwtSecret());
}

/** Looks up the user for a session token; returns null when the token is missing or invalid. */
export async function userFromToken(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, jwtSecret(), { algorithms: ['HS256'] });
    if (!payload.sub) return null;
    const [row] = await getDb().select().from(users).where(eq(users.id, payload.sub)).limit(1);
    return row ? toSessionUser(row) : null;
  } catch {
    return null;
  }
}

function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

/**
 * The signed-in user for an API request. Accepts the session cookie (website) or an
 * `Authorization: Bearer` token (the future mobile app).
 */
export async function requestUser(req: Request): Promise<SessionUser | null> {
  const header = req.headers.get('authorization');
  const token = header?.startsWith('Bearer ')
    ? header.slice(7)
    : readCookie(req.headers.get('cookie'), SESSION_COOKIE);
  return userFromToken(token);
}

export async function requireUser(req: Request, roles?: Role[]): Promise<SessionUser> {
  const user = await requestUser(req);
  if (!user) throw new HttpError(401, 'Please sign in');
  if (roles && !roles.includes(user.role)) throw new HttpError(403, 'You do not have access to this');
  return user;
}

export const STAFF: Role[] = ['ADMIN', 'STAFF'];
export const ADMIN_ONLY: Role[] = ['ADMIN'];

function cookieAttributes(maxAgeSeconds: number) {
  return [
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${maxAgeSeconds}`,
    ...(cookieSecure() ? ['Secure'] : []),
  ].join('; ');
}

export function sessionCookie(token: string) {
  return `${SESSION_COOKIE}=${token}; ${cookieAttributes(SESSION_DAYS * 24 * 60 * 60)}`;
}

export function clearedSessionCookie() {
  return `${SESSION_COOKIE}=; ${cookieAttributes(0)}`;
}
