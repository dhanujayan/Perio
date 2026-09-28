import { requireUser, STAFF } from '@/server/auth';
import { assertUuid, handler, json, readBody } from '@/server/http';
import { draftFaqFromQuestion } from '@/server/services/inbox';
import { draftFaqSchema } from '@/server/validation';

export const POST = handler<{ id: string }>(async (req, { id }) => {
  await requireUser(req, STAFF);
  const { categoryId } = await readBody(req, draftFaqSchema);
  return json(await draftFaqFromQuestion(assertUuid(id), categoryId), 201);
});
