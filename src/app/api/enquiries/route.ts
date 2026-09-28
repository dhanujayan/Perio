import { handler, json, readBody } from '@/server/http';
import { rateLimit } from '@/server/ratelimit';
import { submitEnquiry } from '@/server/services/inbox';
import { enquirySchema } from '@/server/validation';

export const POST = handler(async (req) => {
  await rateLimit(req, 'enquiry', 5);
  await submitEnquiry(await readBody(req, enquirySchema));
  return json({ received: true }, 202);
});
