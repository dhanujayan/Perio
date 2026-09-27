import Link from 'next/link';
import { ContentEditor } from '@/components/admin/ContentEditor';
import { api, getSessionUser } from '@/lib/api';
import type { Category } from '@/lib/types';

export default async function NewFaq() {
  const [categories, user] = await Promise.all([api<Category[]>('/categories'), getSessionUser()]);
  return (
    <div>
      <Link href="/admin/faqs" className="text-sm text-ink-soft hover:underline">
        All FAQs
      </Link>
      <h1 className="mt-2 mb-6 font-serif text-3xl font-semibold">New FAQ</h1>
      <ContentEditor kind="faq" initial={null} categories={categories} isAdmin={user?.role === 'ADMIN'} userName={user?.name ?? ''} />
    </div>
  );
}
