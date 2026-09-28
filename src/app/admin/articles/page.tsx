import Link from 'next/link';
import { FilterLinks, ReviewPill, StatusPill } from '@/components/admin/bits';
import { formatDate } from '@/components/ReviewStatus';
import { api, qs } from '@/lib/api';
import type { AdminArticleRow } from '@/lib/types';

type Params = { status?: string; audience?: string; reviewed?: string };

export default async function AdminArticles({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const rows = await api<AdminArticleRow[]>(`/admin/articles${qs(sp)}`);
  const current = { status: sp.status, audience: sp.audience, reviewed: sp.reviewed };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold">Articles</h1>
        <Link href="/admin/articles/new" className="btn">
          New article
        </Link>
      </div>
      <div className="mt-6 grid gap-3">
        <FilterLinks base="/admin/articles" current={current} param="audience" options={[{ label: 'All audiences' }, { value: 'PATIENT', label: 'Patients' }, { value: 'DENTIST', label: 'Dentists' }]} />
        <FilterLinks base="/admin/articles" current={current} param="status" options={[{ label: 'Any status' }, { value: 'PUBLISHED', label: 'Published' }, { value: 'DRAFT', label: 'Drafts' }]} />
        <FilterLinks base="/admin/articles" current={current} param="reviewed" options={[{ label: 'Any review state' }, { value: 'false', label: 'Needs review' }, { value: 'true', label: 'Reviewed' }]} />
      </div>
      {rows.length ? (
        <ul className="mt-6 divide-y divide-rule border-y border-rule">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
              <div>
                <Link href={`/admin/articles/${r.id}`} className="font-semibold hover:text-teal hover:underline">
                  {r.title}
                </Link>
                <p className="text-sm text-ink-soft">
                  {r.audience === 'DENTIST' ? 'Dentists' : 'Patients'}, {r.category.name}
                  {r.membersOnly && ', members only'}. Updated {formatDate(r.updatedAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <StatusPill status={r.status} />
                <ReviewPill reviewedAt={r.reviewedAt} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-lg border border-dashed border-rule p-6 text-ink-soft">No articles match these filters.</p>
      )}
    </div>
  );
}
