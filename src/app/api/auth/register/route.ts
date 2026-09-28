import { sessionCookie } from '@/server/auth';
import { handler, json, readBody } from '@/server/http';
import { rateLimit } from '@/server/ratelimit';
import { register } from '@/server/services/accounts';
import { registerSchema } from '@/server/validation';

export const POST = handler(async (req) => {
  await rateLimit(req, 'register', 10);
  const { user, token } = await register(await readBody(req, registerSchema));
  // The token is also returned for non-browser clients (the future mobile app)
  return json({ user, token }, 201, { 'set-cookie': sessionCookie(token) });
});
