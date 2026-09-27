import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/api';

export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/admin');
  if (user.role !== 'ADMIN' && user.role !== 'STAFF') redirect('/account');

  const nav = [
    { href: '/admin', label: 'Overview' },
    { href: '/admin/faqs', label: 'FAQs' },
    { href: '/admin/articles', label: 'Articles' },
    { href: '/admin/questions', label: 'Questions' },
    { href: '/admin/enquiries', label: 'Clinic enquiries' },
    ...(user.role === 'ADMIN' ? [{ href: '/admin/members', label: 'Members' }] : []),
  ];

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[12rem_1fr]">
      <aside>
        <p className="text-sm text-ink-soft">
          Signed in as <span className="font-semibold text-ink">{user.name}</span>
          <br />
          {user.role === 'ADMIN' ? 'Specialist (admin)' : 'Staff'}
        </p>
        <nav aria-label="Admin" className="mt-4 flex flex-wrap gap-1 lg:grid">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="rounded px-2 py-1.5 text-[0.95rem] hover:bg-teal-wash">
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
