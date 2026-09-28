import { requestUser } from '@/server/auth';
import { handler, json } from '@/server/http';
import { getPublishedArticle } from '@/server/services/articles';

export const GET = handler<{ slug: string }>(async (req, { slug }) =>
  json(await getPublishedArticle(slug, await requestUser(req))),
);
