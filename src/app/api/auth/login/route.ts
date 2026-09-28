import { sessionCookie } from '@/server/auth';
import { handler, json, readBody } from '@/server/http';
import { rateLimit } from '@/server/ratelimit';
import { login } from '@/server/services/accounts';
import { loginSchema } from '@/server/validation';

export const POST = handler(async (req) => {
  await rateLimit(req, 'login', 10);
  const { user, token } = await login(await readBody(req, loginSchema));
  return json({ user, token }, 200, { 'set-cookie': sessionCookie(token) });
});
