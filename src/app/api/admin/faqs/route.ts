import { requireUser, STAFF } from '@/server/auth';
import { handler, json, readBody, readQuery } from '@/server/http';
import { adminListFaqs, createFaq } from '@/server/services/faqs';
import { adminContentQuery, createFaqSchema } from '@/server/validation';

export const GET = handler(async (req) => {
  await requireUser(req, STAFF);
  return json(await adminListFaqs(readQuery(req, adminContentQuery)));
});

export const POST = handler(async (req) => {
  await requireUser(req, STAFF);
  return json(await createFaq(await readBody(req, createFaqSchema)), 201);
});
