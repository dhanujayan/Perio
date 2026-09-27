import type { Metadata } from 'next';
import Link from 'next/link';
import { cache } from 'react';
import { Markdown } from '@/components/Markdown';
import { formatDate, ReviewStatus } from '@/components/ReviewStatus';
import { apiOr404 } from '@/lib/api';
import type { ArticleDetail } from '@/lib/types';
import { toParam } from '@/lib/types';
import { disclaimer } from '@/site.config';

type Props = { params: Promise<{ slug: string }> };

const getArticle = cache((slug: string) => apiOr404<ArticleDetail>(`/articles/${encodeURIComponent(slug)}`));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await getArticle((await params).slug);
  return {
    title: a.title,
    description: a.summary,
    alternates: { canonical: `/articles/${a.slug}` },
    openGraph: { title: a.title, description: a.summary, type: 'article' },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const a = await getArticle(slug);
  const audience = toParam(a.audience);

  return (
    <article className="mx-auto max-w-3xl px-5 py-12">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
        <Link href={`/articles?for=${audience}`} className="hover:underline">
          Articles
        </Link>
        <span aria-hidden="true"> / </span>
        {a.category.name}
      </nav>
      <h1 className="mt-6 font-serif text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">{a.title}</h1>
      <p className="mt-5 font-serif text-xl leading-relaxed">{a.summary}</p>
      <p className="mt-4 text-sm text-ink-soft">
        {a.audience === 'DENTIST' ? 'For dentists' : 'For patients'}
        {a.publishedAt && <>, published {formatDate(a.publishedAt)}</>}
      </p>
      <div className="mt-4">
        <ReviewStatus reviewedAt={a.reviewedAt} reviewerName={a.reviewerName} updatedAt={a.updatedAt} />
      </div>

      <div className="mt-8 border-t border-rule pt-8">
        {a.locked || !a.body ? (
          <div className="rounded-lg bg-teal-wash p-6">
            <h2 className="font-serif text-2xl font-semibold">Free for registered dentists</h2>
            <p className="mt-2 leading-relaxed text-ink-soft">
              Case-based articles are for dentists and dental students. Sign in, or create a free account to read
              the full article.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/register?next=/articles/${a.slug}`} className="btn">
                Create a free account
              </Link>
              <Link href={`/login?next=/articles/${a.slug}`} className="btn btn-quiet">
                Sign in
              </Link>
            </div>
          </div>
        ) : (
          <Markdown>{a.body}</Markdown>
        )}
      </div>
      <p className="mt-12 text-sm leading-relaxed text-ink-soft">{disclaimer}</p>
    </article>
  );
}
