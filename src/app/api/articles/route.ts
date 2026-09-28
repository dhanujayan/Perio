import { handler, json, readQuery } from '@/server/http';
import { listPublishedArticles } from '@/server/services/articles';
import { listQuery } from '@/server/validation';

export const GET = handler(async (req) => json(await listPublishedArticles(readQuery(req, listQuery))));
