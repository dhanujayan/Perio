import { handler, json } from '@/server/http';
import { articleSitemap } from '@/server/services/articles';
import { faqSitemap } from '@/server/services/faqs';

export const dynamic = 'force-dynamic';

export const GET = handler(async () => {
  const [faqs, articles] = await Promise.all([faqSitemap(), articleSitemap()]);
  return json({ faqs, articles });
});
