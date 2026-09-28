import { ADMIN_ONLY, requireUser, STAFF } from '@/server/auth';
import { assertUuid, handler, json, noContent, readBody } from '@/server/http';
import { adminGetArticle, deleteArticle, updateArticle } from '@/server/services/articles';
import { updateArticleSchema } from '@/server/validation';

type P = { id: string };

export const GET = handler<P>(async (req, { id }) => {
  await requireUser(req, STAFF);
  return json(await adminGetArticle(assertUuid(id)));
});

export const PATCH = handler<P>(async (req, { id }) => {
  await requireUser(req, STAFF);
  return json(await updateArticle(assertUuid(id), await readBody(req, updateArticleSchema)));
});

export const DELETE = handler<P>(async (req, { id }) => {
  await requireUser(req, ADMIN_ONLY);
  await deleteArticle(assertUuid(id));
  return noContent();
});
