import type { Metadata } from 'next';
import Link from 'next/link';
import { AudienceSwitch } from '@/components/AudienceSwitch';
import { FaqList } from '@/components/FaqList';
import { SearchBox } from '@/components/SearchBox';
import { api, qs } from '@/lib/api';
import type { ArticleListItem, AudienceParam, FaqListItem } from '@/lib/types';
import { toAudience } from '@/lib/types';

export const metadata: Metadata = { title: 'Search', robots: { index: false } };

type Params = { q?: string; for?: string };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const q = (sp.q || '').trim().slice(0, 200);
  const audience: AudienceParam = sp.for === 'dentist' ? 'dentist' : 'patient';

  const results = q
    ? await api<{ faqs: FaqListItem[]; articles: ArticleListItem[] }>(
        `/search${qs({ q, audience: toAudience(audience) })}`,
      )
    : { faqs: [], articles: [] };
  const empty = q && !results.faqs.length && !results.articles.length;

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="font-serif text-4xl font-semibold tracking-tight">
        {q ? `Results for “${q}”` : 'Search'}
      </h1>
      <div className="mt-6 grid gap-4">
        <AudienceSwitch current={audience} hrefFor={(a) => `/search${qs({ q, for: a })}`} />
        <SearchBox audience={audience} defaultValue={q} size="small" />
      </div>

      {empty && (
        <div className="mt-10 rounded-lg border border-dashed border-rule p-8">
          <p className="font-semibold">
            No {audience === 'patient' ? 'patient' : 'dentist'} answers match “{q}”.
          </p>
          <ul className="mt-2 list-disc pl-5 text-ink-soft">
            <li>Try fewer or simpler words, such as “bleeding” or “loose tooth”.</li>
            <li>
              Switch to the {audience === 'patient' ? 'dentist' : 'patient'} answers above.
            </li>
            <li>
              <Link href={`/ask?for=${audience}`} className="text-teal underline">
                Send this as a question
              </Link>{' '}
              so it can be answered on the site.
            </li>
          </ul>
        </div>
      )}

      {results.faqs.length > 0 && (
        <section className="mt-10" aria-labelledby="q-results">
          <h2 id="q-results" className="mb-3 text-sm font-semibold text-ink-soft">
            Questions
          </h2>
          <FaqList items={results.faqs} />
        </section>
      )}

      {results.articles.length > 0 && (
        <section className="mt-10" aria-labelledby="a-results">
          <h2 id="a-results" className="mb-3 text-sm font-semibold text-ink-soft">
            Articles
          </h2>
          <ul className="divide-y divide-rule border-y border-rule">
            {results.articles.map((a) => (
              <li key={a.id} className="py-5">
                <Link href={`/articles/${a.slug}`} className="font-serif text-xl font-semibold hover:text-teal">
                  {a.title}
                </Link>
                <p className="mt-1 text-ink-soft">{a.summary}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
