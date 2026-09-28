import { requireUser, STAFF } from '@/server/auth';
import { assertUuid, handler, json, readBody } from '@/server/http';
import { updateQuestion } from '@/server/services/inbox';
import { updateQuestionSchema } from '@/server/validation';

export const PATCH = handler<{ id: string }>(async (req, { id }) => {
  await requireUser(req, STAFF);
  return json(await updateQuestion(assertUuid(id), await readBody(req, updateQuestionSchema)));
});
