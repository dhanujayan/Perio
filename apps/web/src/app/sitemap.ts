import type { MetadataRoute } from 'next';
import { api } from '@/lib/api';
import { site } from '@/site.config';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = site.url.replace(/\/$/, '');
  const fixed = ['', '/faq?for=patient', '/faq?for=dentist', '/articles', '/clinics', '/about', '/ask'].map(
    (p) => ({ url: `${base}${p}` }),
  );
  try {
    const data = await api<{
      faqs: { slug: string; updatedAt: string }[];
      articles: { slug: string; updatedAt: string }[];
    }>('/sitemap');
    return [
      ...fixed,
      ...data.faqs.map((f) => ({ url: `${base}/faq/${f.slug}`, lastModified: f.updatedAt })),
      ...data.articles.map((a) => ({ url: `${base}/articles/${a.slug}`, lastModified: a.updatedAt })),
    ];
  } catch {
    return fixed;
  }
}
