import { ADMIN_ONLY, requireUser } from '@/server/auth';
import { handler, json, readBody } from '@/server/http';
import { createCategory } from '@/server/services/categories';
import { categorySchema } from '@/server/validation';

export const POST = handler(async (req) => {
  await requireUser(req, ADMIN_ONLY);
  return json(await createCategory(await readBody(req, categorySchema)), 201);
});
