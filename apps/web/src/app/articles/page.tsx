import type { Metadata } from 'next';
import Link from 'next/link';
import { AudienceSwitch } from '@/components/AudienceSwitch';
import { Pagination } from '@/components/Pagination';
import { formatDate } from '@/components/ReviewStatus';
import { api, qs } from '@/lib/api';
import type { ArticleListItem, AudienceParam, Paged } from '@/lib/types';
import { toAudience } from '@/lib/types';

export const metadata: Metadata = { title: 'Articles' };

type Params = { for?: string; page?: string };

export default async function Articles({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const audience: AudienceParam = sp.for === 'dentist' ? 'dentist' : 'patient';
  const page = Math.max(1, Number(sp.page) || 1);
  const data = await api<Paged<ArticleListItem>>(
    `/articles${qs({ audience: toAudience(audience), page, pageSize: 20 })}`,
  );

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Articles</h1>
      <p className="mt-3 max-w-2xl text-lg text-ink-soft">
        {audience === 'patient'
          ? 'Longer explanations of gum disease and its treatment.'
          : 'Guides, summaries and case-based checklists for practice.'}
      </p>
      <div className="mt-6">
        <AudienceSwitch current={audience} hrefFor={(a) => `/articles${qs({ for: a })}`} />
      </div>

      {data.items.length ? (
        <ul className="mt-10 divide-y divide-rule border-y border-rule">
          {data.items.map((a) => (
            <li key={a.id} className="py-6">
              <Link href={`/articles/${a.slug}`} className="group block">
                <h2 className="font-serif text-2xl leading-snug font-semibold group-hover:text-teal">{a.title}</h2>
                <p className="mt-2 leading-relaxed text-ink-soft">{a.summary}</p>
                <p className="mt-2 text-sm text-ink-soft">
                  {a.category.name}
                  {a.publishedAt && <>, {formatDate(a.publishedAt)}</>}
                  {a.membersOnly && (
                    <span className="ml-2 rounded bg-teal-wash px-1.5 py-0.5 text-xs font-semibold text-teal">
                      Dentist account
                    </span>
                  )}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 rounded-lg border border-dashed border-rule p-8 text-ink-soft">
          No articles here yet. The{' '}
          <Link href={`/faq?for=${audience}`} className="text-teal underline">
            question library
          </Link>{' '}
          covers the most common topics.
        </p>
      )}
      <Pagination
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        hrefFor={(p) => `/articles${qs({ for: audience, page: p })}`}
      />
    </div>
  );
}
