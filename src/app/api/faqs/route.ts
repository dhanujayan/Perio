import { handler, json, readQuery } from '@/server/http';
import { listPublishedFaqs } from '@/server/services/faqs';
import { listQuery } from '@/server/validation';

export const GET = handler(async (req) => json(await listPublishedFaqs(readQuery(req, listQuery))));
