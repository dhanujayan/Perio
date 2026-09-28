'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Markdown } from '@/components/Markdown';
import { formatDate } from '@/components/ReviewStatus';
import { ClientError, send } from '@/lib/client';
import type { AdminArticle, AdminFaq, Audience, Category, ContentStatus } from '@/lib/types';
import { ReviewPill, StatusPill } from './bits';

type Kind = 'faq' | 'article';

interface Values {
  audience: Audience;
  categoryId: string;
  title: string; // question for FAQs
  summary: string;
  body: string; // answer for FAQs
  references: string;
  membersOnly: boolean;
  tags: string;
  slug: string;
}

interface Meta {
  id?: string;
  status: ContentStatus;
  reviewedAt: string | null;
  reviewerName: string | null;
  slug?: string;
  updatedAt?: string;
}

function toValues(kind: Kind, r: AdminFaq | AdminArticle | null, categories: Category[]): Values {
  if (!r) {
    return {
      audience: 'PATIENT',
      categoryId: categories[0]?.id ?? '',
      title: '',
      summary: '',
      body: '',
      references: '',
      membersOnly: false,
      tags: '',
      slug: '',
    };
  }
  const faq = kind === 'faq' ? (r as AdminFaq) : null;
  const art = kind === 'article' ? (r as AdminArticle) : null;
  return {
    audience: r.audience,
    categoryId: r.categoryId,
    title: faq ? faq.question : art!.title,
    summary: r.summary,
    body: faq ? faq.answer : art!.body,
    references: faq?.references ?? '',
    membersOnly: art?.membersOnly ?? false,
    tags: r.tags.join(', '),
    slug: r.slug,
  };
}

function toPayload(kind: Kind, v: Values) {
  const tags = v.tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const common = {
    audience: v.audience,
    categoryId: v.categoryId,
    summary: v.summary,
    tags,
    ...(v.slug ? { slug: v.slug } : {}),
  };
  return kind === 'faq'
    ? { ...common, question: v.title, answer: v.body, references: v.references || null }
    : { ...common, title: v.title, body: v.body, membersOnly: v.membersOnly };
}

export function ContentEditor({
  kind,
  initial,
  categories,
  isAdmin,
  userName,
}: {
  kind: Kind;
  initial: AdminFaq | AdminArticle | null;
  categories: Category[];
  isAdmin: boolean;
  userName: string;
}) {
  const router = useRouter();
  const base = kind === 'faq' ? '/admin/faqs' : '/admin/articles';
  const publicBase = kind === 'faq' ? '/faq' : '/articles';
  const [saved, setSaved] = useState<Values>(() => toValues(kind, initial, categories));
  const [v, setV] = useState<Values>(saved);
  const [meta, setMeta] = useState<Meta>({
    id: initial?.id,
    status: initial?.status ?? 'DRAFT',
    reviewedAt: initial?.reviewedAt ?? null,
    reviewerName: initial?.reviewerName ?? null,
    slug: initial?.slug,
    updatedAt: initial?.updatedAt,
  });
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<ClientError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const dirty = useMemo(() => JSON.stringify(v) !== JSON.stringify(saved), [v, saved]);
  const set = <K extends keyof Values>(k: K, val: Values[K]) => setV((p) => ({ ...p, [k]: val }));
  const f = error?.fields ?? {};
  // API field names differ for FAQs: map them back onto the form
  const fieldErr = (name: keyof Values) =>
    f[name] ?? (kind === 'faq' ? f[{ title: 'question', body: 'answer' }[name as string] ?? ''] : undefined);

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label);
    setError(null);
    setNotice(null);
    try {
      await fn();
    } catch (e) {
      setError(e as ClientError);
    } finally {
      setBusy(null);
    }
  }

  const save = () =>
    run('save', async () => {
      const payload = toPayload(kind, v);
      if (!meta.id) {
        const row = await send<{ id: string }>(base, 'POST', payload);
        router.replace(`${base}/${row.id}?created=1`);
        return;
      }
      const row = await send<{ slug: string; reviewedAt: string | null; updatedAt: string; reviewCleared: boolean }>(
        `${base}/${meta.id}`,
        'PATCH',
        payload,
      );
      const next = { ...v, slug: row.slug };
      setSaved(next);
      setV(next);
      setMeta((m) => ({
        ...m,
        slug: row.slug,
        updatedAt: row.updatedAt,
        reviewedAt: row.reviewedAt,
        reviewerName: row.reviewedAt ? m.reviewerName : null,
      }));
      setNotice(
        row.reviewCleared
          ? 'Saved. The clinical content changed, so the review was cleared and needs to be done again.'
          : 'Saved.',
      );
    });

  const action = (path: string, label: string, after: (row: { status: ContentStatus; reviewedAt: string | null }) => string) =>
    run(label, async () => {
      const row = await send<{ status: ContentStatus; reviewedAt: string | null }>(`${base}/${meta.id}/${path}`, 'POST');
      setMeta((m) => ({
        ...m,
        status: row.status,
        reviewedAt: row.reviewedAt,
        reviewerName: path === 'review' ? userName : m.reviewerName,
      }));
      setNotice(after(row));
      router.refresh();
    });

  const remove = () =>
    run('delete', async () => {
      if (!confirm('Delete permanently? This cannot be undone. Unpublish instead if you may want it back.')) return;
      await send(`${base}/${meta.id}`, 'DELETE');
      router.replace(base);
    });

  const titleLabel = kind === 'faq' ? 'Question' : 'Title';
  const bodyLabel = kind === 'faq' ? 'Full answer' : 'Article body';

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_18rem]">
      <form
        className="grid gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="field">
            <label htmlFor="audience">Audience</label>
            <select id="audience" className="input" value={v.audience} onChange={(e) => set('audience', e.target.value as Audience)}>
              <option value="PATIENT">Patients</option>
              <option value="DENTIST">Dentists</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="category">Topic</label>
            <select id="category" className="input" value={v.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="title">{titleLabel}</label>
          <input id="title" className="input font-serif text-lg" value={v.title} maxLength={300} onChange={(e) => set('title', e.target.value)} aria-invalid={!!fieldErr('title')} />
          {fieldErr('title') && <p className="error">{fieldErr('title')}</p>}
        </div>

        <div className="field">
          <label htmlFor="summary">Short answer</label>
          <p className="hint">One or two plain sentences. Shown in lists, search results and Google.</p>
          <textarea id="summary" className="input" style={{ minHeight: '5rem' }} value={v.summary} maxLength={400} onChange={(e) => set('summary', e.target.value)} aria-invalid={!!fieldErr('summary')} />
          <p className="hint">{v.summary.length}/400</p>
          {fieldErr('summary') && <p className="error">{fieldErr('summary')}</p>}
        </div>

        <div className="field">
          <div className="flex items-center justify-between">
            <label htmlFor="body">{bodyLabel}</label>
            <div className="flex gap-1 text-sm" role="tablist">
              <button type="button" role="tab" aria-selected={!preview} onClick={() => setPreview(false)} className={`rounded px-2 py-0.5 ${!preview ? 'bg-ink text-white' : ''}`}>
                Write
              </button>
              <button type="button" role="tab" aria-selected={preview} onClick={() => setPreview(true)} className={`rounded px-2 py-0.5 ${preview ? 'bg-ink text-white' : ''}`}>
                Preview
              </button>
            </div>
          </div>
          <p className="hint">
            Markdown: **bold**, - bullet lists, 1. numbered lists, ## headings, | tables |, [link](https://…).
          </p>
          {preview ? (
            <div className="rounded-md border border-rule bg-paper p-5">
              {v.body.trim() ? <Markdown>{v.body}</Markdown> : <p className="text-ink-soft">Nothing to preview yet.</p>}
            </div>
          ) : (
            <textarea id="body" className="input font-mono text-sm" style={{ minHeight: '24rem' }} value={v.body} onChange={(e) => set('body', e.target.value)} aria-invalid={!!fieldErr('body')} />
          )}
          {fieldErr('body') && <p className="error">{fieldErr('body')}</p>}
        </div>

        {kind === 'faq' ? (
          <div className="field">
            <label htmlFor="refs">References</label>
            <p className="hint">One per line, starting with “- ”. Recommended for dentist answers.</p>
            <textarea id="refs" className="input font-mono text-sm" value={v.references} onChange={(e) => set('references', e.target.value)} />
          </div>
        ) : (
          <label className="flex items-center gap-2">
            <input type="checkbox" className="size-4 accent-[var(--color-teal)]" checked={v.membersOnly} onChange={(e) => set('membersOnly', e.target.checked)} />
            Only for signed-in dentists
          </label>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="field">
            <label htmlFor="tags">Tags</label>
            <p className="hint">Comma separated.</p>
            <input id="tags" className="input" value={v.tags} onChange={(e) => set('tags', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="slug">Web address</label>
            <p className="hint">Leave blank to create from the {titleLabel.toLowerCase()}.</p>
            <input id="slug" className="input" value={v.slug} onChange={(e) => set('slug', e.target.value.toLowerCase())} aria-invalid={!!f.slug} />
            {f.slug && <p className="error">{f.slug}</p>}
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error.message}
          </p>
        )}
        {notice && (
          <p role="status" className="rounded-md bg-teal-wash px-3 py-2 text-sm">
            {notice}
          </p>
        )}

        <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-3 border-t border-rule bg-enamel px-1 py-3">
          <button className="btn" disabled={!!busy || (!dirty && !!meta.id)}>
            {busy === 'save' ? 'Saving…' : meta.id ? 'Save changes' : 'Create draft'}
          </button>
          {dirty && meta.id && <span className="text-sm text-warn">Unsaved changes</span>}
        </div>
      </form>

      <aside className="grid content-start gap-6">
        {meta.id ? (
          <>
            <section className="rounded-lg border border-rule bg-paper p-4">
              <h2 className="text-sm font-semibold text-ink-soft">Status</h2>
              <p className="mt-2">
                <StatusPill status={meta.status} />
              </p>
              {meta.updatedAt && <p className="mt-2 text-sm text-ink-soft">Updated {formatDate(meta.updatedAt)}</p>}
              <div className="mt-3 grid gap-2">
                {meta.status !== 'PUBLISHED' ? (
                  <button type="button" className="btn text-sm" disabled={!!busy || dirty} onClick={() => action('publish', 'publish', () => 'Published. It is now live on the site.')}>
                    {busy === 'publish' ? 'Publishing…' : 'Publish'}
                  </button>
                ) : (
                  <>
                    <Link href={`${publicBase}/${meta.slug}`} target="_blank" className="btn btn-quiet text-sm">
                      View on site
                    </Link>
                    <button type="button" className="btn btn-quiet text-sm" disabled={!!busy} onClick={() => action('unpublish', 'unpublish', () => 'Unpublished. It is no longer visible on the site.')}>
                      Unpublish
                    </button>
                  </>
                )}
                {dirty && <p className="text-xs text-ink-soft">Save changes before publishing or reviewing.</p>}
              </div>
            </section>

            <section className="rounded-lg border border-rule bg-paper p-4">
              <h2 className="text-sm font-semibold text-ink-soft">Clinical review</h2>
              <p className="mt-2">
                <ReviewPill reviewedAt={meta.reviewedAt} />
              </p>
              {meta.reviewedAt && (
                <p className="mt-2 text-sm text-ink-soft">
                  {meta.reviewerName ? `${meta.reviewerName}, ` : ''}
                  {formatDate(meta.reviewedAt)}
                </p>
              )}
              <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                Editing the {kind === 'faq' ? 'question, answer or references' : 'title, summary or body'} clears the review.
              </p>
              {isAdmin ? (
                <button type="button" className="btn btn-gum mt-3 w-full text-sm" disabled={!!busy || dirty} onClick={() => action('review', 'review', () => 'Marked as clinically reviewed.')}>
                  {busy === 'review' ? 'Saving…' : meta.reviewedAt ? 'Re-confirm review' : 'Mark as reviewed'}
                </button>
              ) : (
                <p className="mt-3 text-xs text-ink-soft">Only the specialist can mark content as reviewed.</p>
              )}
            </section>

            {isAdmin && (
              <button type="button" className="text-left text-sm text-danger underline" disabled={!!busy} onClick={remove}>
                Delete permanently
              </button>
            )}
          </>
        ) : (
          <p className="rounded-lg border border-dashed border-rule p-4 text-sm text-ink-soft">
            New content is saved as a draft. You can publish and review it after creating it.
          </p>
        )}
      </aside>
    </div>
  );
}
