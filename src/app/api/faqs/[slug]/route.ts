import { handler, json } from '@/server/http';
import { getPublishedFaq } from '@/server/services/faqs';

export const GET = handler<{ slug: string }>(async (_req, { slug }) => json(await getPublishedFaq(slug)));
