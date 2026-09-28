import { eq, sql } from 'drizzle-orm';
import type { z } from 'zod';
import { checkPassword, hashPassword, signSession, toSessionUser, type SessionUser } from '../auth';
import { getDb } from '../db';
import { HttpError } from '../http';
import { users, type Role } from '../schema';
import type { loginSchema, registerSchema, setupSchema } from '../validation';

export async function register(dto: z.infer<typeof registerSchema>) {
  const db = getDb();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, dto.email)).limit(1);
  if (existing) throw new HttpError(409, 'An account with this email already exists', { email: 'Already registered. Sign in instead.' });

  const [row] = await db
    .insert(users)
    .values({
      name: dto.name,
      email: dto.email,
      passwordHash: await hashPassword(dto.password),
      role: 'DENTIST', // public sign-up can never create staff or admins
      isStudent: dto.isStudent ?? false,
      registrationNo: dto.registrationNo ?? null,
      city: dto.city ?? null,
      phone: dto.phone ?? null,
    })
    .returning();
  const user = toSessionUser(row);
  return { user, token: await signSession(user) };
}

export async function login(dto: z.infer<typeof loginSchema>) {
  const [row] = await getDb().select().from(users).where(eq(users.email, dto.email)).limit(1);
  const ok = await checkPassword(dto.password, row?.passwordHash);
  if (!row || !ok) throw new HttpError(401, 'Email or password is incorrect');
  const user = toSessionUser(row);
  return { user, token: await signSession(user) };
}

export async function adminExists(): Promise<boolean> {
  const [row] = await getDb()
    .select({ n: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.role, 'ADMIN'));
  return row.n > 0;
}

/**
 * First-run setup: creates the specialist's admin account. Works only while no admin exists and
 * only with the SETUP_TOKEN set in the hosting environment, so nobody else can claim the site.
 */
export async function createFirstAdmin(dto: z.infer<typeof setupSchema>) {
  const expected = process.env.SETUP_TOKEN;
  if (!expected || expected.length < 12) {
    throw new HttpError(403, 'Setup is not enabled. Set SETUP_TOKEN (12+ characters) in the site settings.');
  }
  if (await adminExists()) throw new HttpError(403, 'Setup has already been completed. Sign in instead.');
  if (!timingSafeEqual(dto.token, expected)) {
    throw new HttpError(403, 'The setup code is incorrect', { token: 'The setup code is incorrect' });
  }
  return createUser({ ...dto, role: 'ADMIN' });
}

export async function createUser(input: { name: string; email: string; password: string; role: Role }) {
  const db = getDb();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
  if (existing) throw new HttpError(409, 'An account with this email already exists');
  const [row] = await db
    .insert(users)
    .values({
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: input.role,
    })
    .returning();
  const user: SessionUser = toSessionUser(row);
  return { user, token: await signSession(user) };
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
