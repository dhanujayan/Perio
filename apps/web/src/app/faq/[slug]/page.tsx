import type { Metadata } from 'next';
import Link from 'next/link';
import { cache } from 'react';
import { Markdown } from '@/components/Markdown';
import { ReviewStatus } from '@/components/ReviewStatus';
import { apiOr404 } from '@/lib/api';
import type { FaqDetail } from '@/lib/types';
import { toParam } from '@/lib/types';
import { disclaimer, site } from '@/site.config';

type Props = { params: Promise<{ slug: string }> };

// One API call per request, shared by the metadata and the page (so views are counted once)
const getFaq = cache((slug: string) => apiOr404<FaqDetail>(`/faqs/${encodeURIComponent(slug)}`));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const faq = await getFaq(slug);
  return {
    title: faq.question,
    description: faq.summary,
    alternates: { canonical: `/faq/${faq.slug}` },
    openGraph: { title: faq.question, description: faq.summary, type: 'article' },
  };
}

export default async function FaqPage({ params }: Props) {
  const { slug } = await params;
  const faq = await getFaq(slug);
  const audience = toParam(faq.audience);
  const forDentists = faq.audience === 'DENTIST';

  // FAQ structured data helps search engines show the answer; the summary is used as the answer text
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.summary },
      },
    ],
    ...(faq.reviewedAt && { lastReviewed: faq.reviewedAt.slice(0, 10) }),
  };

  return (
    <article className="mx-auto max-w-6xl px-5 py-12">
      <script
        type="application/ld+json"
        // JSON.stringify output with < escaped cannot break out of the script tag
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
        <Link href={`/faq?for=${audience}`} className="hover:underline">
          {forDentists ? 'Answers for dentists' : 'Answers for patients'}
        </Link>
        <span aria-hidden="true"> / </span>
        <Link href={`/faq?for=${audience}&category=${faq.category.slug}`} className="hover:underline">
          {faq.category.name}
        </Link>
      </nav>

      <div className="mt-6 grid gap-12 lg:grid-cols-[1fr_18rem]">
        <div>
          <h1 className="max-w-3xl font-serif text-4xl leading-tight font-semibold tracking-tight sm:text-[2.75rem]">
            {faq.question}
          </h1>
          <p className="mt-5 max-w-[68ch] font-serif text-xl leading-relaxed text-ink">{faq.summary}</p>
          <div className="mt-5 max-w-[68ch]">
            <ReviewStatus reviewedAt={faq.reviewedAt} reviewerName={faq.reviewerName} updatedAt={faq.updatedAt} />
          </div>

          <div className="mt-8 border-t border-rule pt-8">
            <Markdown>{faq.answer}</Markdown>
          </div>

          {faq.references && (
            <section className="mt-12 max-w-[68ch] border-t border-rule pt-6" aria-labelledby="refs">
              <h2 id="refs" className="text-sm font-semibold text-ink-soft">
                References
              </h2>
              <Markdown className="answer mt-2 text-[0.95rem] leading-relaxed">{faq.references}</Markdown>
            </section>
          )}

          <p className="mt-12 max-w-[68ch] text-sm leading-relaxed text-ink-soft">{disclaimer}</p>
        </div>

        <aside className="grid content-start gap-10">
          {faq.related.length > 0 && (
            <section aria-labelledby="related">
              <h2 id="related" className="text-sm font-semibold text-ink-soft">
                Related questions
              </h2>
              <ul className="mt-3 grid gap-3">
                {faq.related.map((r) => (
                  <li key={r.id}>
                    <Link href={`/faq/${r.slug}`} className="font-serif leading-snug hover:text-teal">
                      {r.question}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {forDentists ? (
            <section className="rounded-lg bg-teal-wash p-5">
              <h2 className="font-semibold">Go deeper</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                Free dentist accounts get case-based articles and first notice of webinars.
              </p>
              <Link href="/register" className="btn mt-4 text-sm">
                Create a free account
              </Link>
            </section>
          ) : (
            <section className="rounded-lg bg-gum-wash p-5">
              <h2 className="font-semibold">Worried about your gums?</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                Ask your dentist for a gum check, or ask to see a periodontist.
              </p>
              <Link href="/faq/what-is-a-periodontist" className="mt-3 inline-block text-sm font-semibold text-gum-deep underline">
                What a periodontist does
              </Link>
            </section>
          )}
          <p className="text-sm">
            Still unsure?{' '}
            <Link href={`/ask?for=${audience}`} className="font-semibold text-teal underline">
              Ask {site.specialist.name.split(' ').slice(0, 2).join(' ')} a question
            </Link>
          </p>
        </aside>
      </div>
    </article>
  );
}
