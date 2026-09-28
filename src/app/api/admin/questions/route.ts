import { requireUser, STAFF } from '@/server/auth';
import { handler, json, readQuery } from '@/server/http';
import { listQuestions } from '@/server/services/inbox';
import { questionFilter } from '@/server/validation';

export const GET = handler(async (req) => {
  await requireUser(req, STAFF);
  return json(await listQuestions(readQuery(req, questionFilter)));
});
