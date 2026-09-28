import type { Metadata } from 'next';
import Link from 'next/link';
import { AudienceSwitch } from '@/components/AudienceSwitch';
import { FaqList } from '@/components/FaqList';
import { Pagination } from '@/components/Pagination';
import { SearchBox } from '@/components/SearchBox';
import { api, qs } from '@/lib/api';
import type { AudienceParam, Category, FaqListItem, Paged } from '@/lib/types';
import { toAudience } from '@/lib/types';

type Params = { for?: string; category?: string; page?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const { for: f } = await searchParams;
  return {
    title: f === 'dentist' ? 'Periodontal questions for dentists' : 'Gum health questions for patients',
    alternates: { canonical: f === 'dentist' ? '/faq?for=dentist' : '/faq?for=patient' },
  };
}

export default async function FaqIndex({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const audience: AudienceParam = sp.for === 'dentist' ? 'dentist' : 'patient';
  const page = Math.max(1, Number(sp.page) || 1);
  const category = sp.category || undefined;

  const [categories, faqs] = await Promise.all([
    api<Category[]>(`/categories${qs({ audience: toAudience(audience) })}`),
    api<Paged<FaqListItem>>(
      `/faqs${qs({ audience: toAudience(audience), category, page, pageSize: 20 })}`,
    ),
  ]);
  const topics = categories.filter((c) => c.faqCount > 0 || c.slug === category);
  const current = categories.find((c) => c.slug === category);
  const href = (p: Record<string, string | number | undefined>) =>
    `/faq${qs({ for: audience, category, ...p })}`;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
        {audience === 'patient' ? 'Answers for patients' : 'Answers for dentists'}
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-ink-soft">
        {audience === 'patient'
          ? 'Plain-language answers about gums, loose teeth and treatment.'
          : 'Clinical answers on classification, treatment, prognosis and referral, with references.'}
      </p>
      <div className="mt-6 grid gap-4">
        <AudienceSwitch current={audience} hrefFor={(a) => `/faq${qs({ for: a, category })}`} />
        <SearchBox audience={audience} size="small" />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[14rem_1fr]">
        <nav aria-label="Topics" className="text-[0.95rem]">
          <h2 className="mb-2 text-sm font-semibold text-ink-soft">Topics</h2>
          <ul className="flex flex-wrap gap-2 lg:grid lg:gap-0.5">
            <li>
              <Link
                href={`/faq${qs({ for: audience })}`}
                aria-current={!category ? 'page' : undefined}
                className={`block rounded px-2 py-1 ${!category ? 'bg-teal-wash font-semibold' : 'hover:bg-teal-wash'}`}
              >
                All topics
              </Link>
            </li>
            {topics.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/faq${qs({ for: audience, category: c.slug })}`}
                  aria-current={c.slug === category ? 'page' : undefined}
                  className={`flex justify-between gap-3 rounded px-2 py-1 ${
                    c.slug === category ? 'bg-teal-wash font-semibold' : 'hover:bg-teal-wash'
                  }`}
                >
                  <span>{c.name}</span>
                  <span className="text-ink-soft tabular-nums">{c.faqCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section aria-label="Questions">
          {current && (
            <div className="mb-4">
              <h2 className="font-serif text-2xl font-semibold">{current.name}</h2>
              {current.description && <p className="text-ink-soft">{current.description}</p>}
            </div>
          )}
          {faqs.items.length ? (
            <FaqList items={faqs.items} showCategory={!current} />
          ) : (
            <div className="rounded-lg border border-dashed border-rule p-8">
              <p className="font-semibold">No answers in this topic yet.</p>
              <p className="mt-1 text-ink-soft">
                Send your question and it may become the first one.{' '}
                <Link href={`/ask?for=${audience}`} className="text-teal underline">
                  Ask a question
                </Link>
              </p>
            </div>
          )}
          <Pagination
            page={faqs.page}
            pageSize={faqs.pageSize}
            total={faqs.total}
            hrefFor={(p) => href({ page: p })}
          />
        </section>
      </div>
    </div>
  );
}
