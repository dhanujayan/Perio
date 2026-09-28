import Link from 'next/link';
import { ContentEditor } from '@/components/admin/ContentEditor';
import { api, getSessionUser } from '@/lib/api';
import type { Category } from '@/lib/types';

export default async function NewArticle() {
  const [categories, user] = await Promise.all([api<Category[]>('/categories'), getSessionUser()]);
  return (
    <div>
      <Link href="/admin/articles" className="text-sm text-ink-soft hover:underline">
        All articles
      </Link>
      <h1 className="mt-2 mb-6 font-serif text-3xl font-semibold">New article</h1>
      <ContentEditor kind="article" initial={null} categories={categories} isAdmin={user?.role === 'ADMIN'} userName={user?.name ?? ''} />
    </div>
  );
}
