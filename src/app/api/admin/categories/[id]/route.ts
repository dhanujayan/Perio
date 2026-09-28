import { ADMIN_ONLY, requireUser } from '@/server/auth';
import { assertUuid, handler, json, readBody } from '@/server/http';
import { updateCategory } from '@/server/services/categories';
import { categorySchema } from '@/server/validation';

export const PATCH = handler<{ id: string }>(async (req, { id }) => {
  await requireUser(req, ADMIN_ONLY);
  return json(await updateCategory(assertUuid(id), await readBody(req, categorySchema.partial())));
});
