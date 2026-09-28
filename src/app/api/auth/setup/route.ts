import { sessionCookie } from '@/server/auth';
import { handler, json, readBody } from '@/server/http';
import { rateLimit } from '@/server/ratelimit';
import { createFirstAdmin } from '@/server/services/accounts';
import { setupSchema } from '@/server/validation';

/** First-run: create the specialist's admin account (see /setup). */
export const POST = handler(async (req) => {
  await rateLimit(req, 'setup', 5);
  const { user, token } = await createFirstAdmin(await readBody(req, setupSchema));
  return json({ user }, 201, { 'set-cookie': sessionCookie(token) });
});
