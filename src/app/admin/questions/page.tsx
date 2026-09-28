import { FilterLinks } from '@/components/admin/bits';
import { QuestionItem } from '@/components/admin/InboxItems';
import { api, qs } from '@/lib/api';
import type { Category, Question } from '@/lib/types';

export default async function AdminQuestions({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const [rows, categories] = await Promise.all([
    api<Question[]>(`/admin/questions${qs({ status })}`),
    api<Category[]>('/categories'),
  ]);
  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold">Questions</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Submitted through “Ask a question”. Turn common ones into FAQs so everyone benefits.
      </p>
      <div className="mt-6">
        <FilterLinks base="/admin/questions" current={{ status }} param="status" options={[{ label: 'All' }, { value: 'NEW', label: 'New' }, { value: 'ANSWERED', label: 'Answered' }, { value: 'ARCHIVED', label: 'Archived' }]} />
      </div>
      {rows.length ? (
        <ul className="mt-6 divide-y divide-rule border-y border-rule">
          {rows.map((q) => (
            <QuestionItem key={q.id} q={q} categories={categories} />
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-lg border border-dashed border-rule p-6 text-ink-soft">No questions here.</p>
      )}
    </div>
  );
}
