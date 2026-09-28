import { handler, json, readQuery } from '@/server/http';
import { listCategories } from '@/server/services/categories';
import { audienceQuery } from '@/server/validation';

export const GET = handler(async (req) => json(await listCategories(readQuery(req, audienceQuery).audience)));
