import { ADMIN_ONLY, requireUser, STAFF } from '@/server/auth';
import { assertUuid, handler, json, noContent, readBody } from '@/server/http';
import { adminGetFaq, deleteFaq, updateFaq } from '@/server/services/faqs';
import { updateFaqSchema } from '@/server/validation';

type P = { id: string };

export const GET = handler<P>(async (req, { id }) => {
  await requireUser(req, STAFF);
  return json(await adminGetFaq(assertUuid(id)));
});

export const PATCH = handler<P>(async (req, { id }) => {
  await requireUser(req, STAFF);
  return json(await updateFaq(assertUuid(id), await readBody(req, updateFaqSchema)));
});

/** Only the specialist can delete. */
export const DELETE = handler<P>(async (req, { id }) => {
  await requireUser(req, ADMIN_ONLY);
  await deleteFaq(assertUuid(id));
  return noContent();
});
