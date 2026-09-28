import Link from 'next/link';
import { FilterLinks, ReviewPill, StatusPill } from '@/components/admin/bits';
import { formatDate } from '@/components/ReviewStatus';
import { api, qs } from '@/lib/api';
import type { AdminFaqRow } from '@/lib/types';

type Params = { status?: string; audience?: string; reviewed?: string; q?: string };

export default async function AdminFaqs({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const rows = await api<AdminFaqRow[]>(`/admin/faqs${qs(sp)}`);
  const current = { status: sp.status, audience: sp.audience, reviewed: sp.reviewed, q: sp.q };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold">FAQs</h1>
        <Link href="/admin/faqs/new" className="btn">
          New FAQ
        </Link>
      </div>

      <div className="mt-6 grid gap-3">
        <FilterLinks base="/admin/faqs" current={current} param="audience" options={[{ label: 'All audiences' }, { value: 'PATIENT', label: 'Patients' }, { value: 'DENTIST', label: 'Dentists' }]} />
        <FilterLinks base="/admin/faqs" current={current} param="status" options={[{ label: 'Any status' }, { value: 'PUBLISHED', label: 'Published' }, { value: 'DRAFT', label: 'Drafts' }, { value: 'ARCHIVED', label: 'Archived' }]} />
        <FilterLinks base="/admin/faqs" current={current} param="reviewed" options={[{ label: 'Any review state' }, { value: 'false', label: 'Needs review' }, { value: 'true', label: 'Reviewed' }]} />
        <form className="flex max-w-md gap-2" action="/admin/faqs">
          {Object.entries(current).map(([k, v]) => (k !== 'q' && v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
          <label htmlFor="admin-q" className="sr-only">Search FAQs</label>
          <input id="admin-q" name="q" defaultValue={sp.q} placeholder="Search questions" className="input py-1.5" />
          <button className="btn btn-quiet py-1.5">Search</button>
        </form>
      </div>

      <p className="mt-6 text-sm text-ink-soft">{rows.length} {rows.length === 1 ? 'FAQ' : 'FAQs'}</p>
      {rows.length ? (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[46rem] text-left text-[0.95rem]">
            <thead className="border-b border-rule text-sm text-ink-soft">
              <tr>
                <th className="py-2 pr-4 font-semibold">Question</th>
                <th className="py-2 pr-4 font-semibold">Audience</th>
                <th className="py-2 pr-4 font-semibold">Status</th>
                <th className="py-2 pr-4 font-semibold">Review</th>
                <th className="py-2 pr-4 font-semibold text-right">Views</th>
                <th className="py-2 font-semibold">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {rows.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="py-3 pr-4">
                    <Link href={`/admin/faqs/${r.id}`} className="font-semibold hover:text-teal hover:underline">
                      {r.question}
                    </Link>
                    <span className="block text-sm text-ink-soft">{r.category.name}</span>
                  </td>
                  <td className="py-3 pr-4">{r.audience === 'DENTIST' ? 'Dentists' : 'Patients'}</td>
                  <td className="py-3 pr-4"><StatusPill status={r.status} /></td>
                  <td className="py-3 pr-4"><ReviewPill reviewedAt={r.reviewedAt} /></td>
                  <td className="py-3 pr-4 text-right tabular-nums">{r.viewCount}</td>
                  <td className="py-3 whitespace-nowrap text-ink-soft">{formatDate(r.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed border-rule p-6 text-ink-soft">
          No FAQs match these filters.
        </p>
      )}
    </div>
  );
}
