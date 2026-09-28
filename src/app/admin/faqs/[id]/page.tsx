import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ContentEditor } from '@/components/admin/ContentEditor';
import { api, ApiError, getSessionUser } from '@/lib/api';
import type { AdminFaq, Category } from '@/lib/types';

export default async function EditFaq({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  let faq: AdminFaq;
  try {
    faq = await api<AdminFaq>(`/admin/faqs/${encodeURIComponent(id)}`);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 400)) notFound();
    throw e;
  }
  const [categories, user] = await Promise.all([api<Category[]>('/categories'), getSessionUser()]);

  return (
    <div>
      <Link href="/admin/faqs" className="text-sm text-ink-soft hover:underline">
        All FAQs
      </Link>
      <h1 className="mt-2 mb-6 font-serif text-3xl font-semibold">Edit FAQ</h1>
      {created && (
        <p role="status" className="mb-6 rounded-md bg-teal-wash px-3 py-2 text-sm">
          Draft created. Publish it when it is ready.
        </p>
      )}
      <ContentEditor kind="faq" initial={faq} categories={categories} isAdmin={user?.role === 'ADMIN'} userName={user?.name ?? ''} />
    </div>
  );
}
