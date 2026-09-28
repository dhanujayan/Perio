import { requireUser, STAFF } from '@/server/auth';
import { handler, json, readBody, readQuery } from '@/server/http';
import { adminListArticles, createArticle } from '@/server/services/articles';
import { adminContentQuery, createArticleSchema } from '@/server/validation';

export const GET = handler(async (req) => {
  await requireUser(req, STAFF);
  return json(await adminListArticles(readQuery(req, adminContentQuery)));
});

export const POST = handler(async (req) => {
  await requireUser(req, STAFF);
  return json(await createArticle(await readBody(req, createArticleSchema)), 201);
});
