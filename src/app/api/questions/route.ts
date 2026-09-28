import { handler, json, readBody } from '@/server/http';
import { rateLimit } from '@/server/ratelimit';
import { submitQuestion } from '@/server/services/inbox';
import { askSchema } from '@/server/validation';

export const POST = handler(async (req) => {
  await rateLimit(req, 'question', 5);
  await submitQuestion(await readBody(req, askSchema));
  return json({ received: true }, 202);
});
