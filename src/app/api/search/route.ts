import { handler, json, readQuery } from '@/server/http';
import { listPublishedArticles } from '@/server/services/articles';
import { listPublishedFaqs } from '@/server/services/faqs';
import { searchQuery } from '@/server/validation';

/** One search box across FAQs and articles. */
export const GET = handler(async (req) => {
  const { q, audience } = readQuery(req, searchQuery);
  const [faqs, articles] = await Promise.all([
    listPublishedFaqs({ q, audience, page: 1, pageSize: 10 }),
    listPublishedArticles({ q, audience, page: 1, pageSize: 5 }),
  ]);
  return json({ q, faqs: faqs.items, articles: articles.items });
});
