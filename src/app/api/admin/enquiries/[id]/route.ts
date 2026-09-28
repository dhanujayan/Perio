import { requireUser, STAFF } from '@/server/auth';
import { assertUuid, handler, json, readBody } from '@/server/http';
import { updateEnquiry } from '@/server/services/inbox';
import { updateEnquirySchema } from '@/server/validation';

export const PATCH = handler<{ id: string }>(async (req, { id }) => {
  await requireUser(req, STAFF);
  return json(await updateEnquiry(assertUuid(id), await readBody(req, updateEnquirySchema)));
});
