import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SignOutButton } from '@/components/forms/SignOutButton';
import { formatDate } from '@/components/ReviewStatus';
import { getSessionUser } from '@/lib/api';

export const metadata: Metadata = { title: 'Your account', robots: { index: false } };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/account');
  const { welcome } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      {welcome && (
        <p role="status" className="mb-8 rounded-lg bg-teal-wash px-4 py-3">
          Welcome, {user.name.split(' ')[0]}. Your account is ready.
        </p>
      )}
      <h1 className="font-serif text-4xl font-semibold tracking-tight">Your account</h1>
      <dl className="mt-8 grid grid-cols-[10rem_1fr] gap-y-3 border-y border-rule py-6">
        <dt className="text-ink-soft">Name</dt>
        <dd>{user.name}</dd>
        <dt className="text-ink-soft">Email</dt>
        <dd>{user.email}</dd>
        <dt className="text-ink-soft">{user.isStudent ? 'College' : 'Registration'}</dt>
        <dd>{user.registrationNo || 'Not given'}</dd>
        <dt className="text-ink-soft">City</dt>
        <dd>{user.city || 'Not given'}</dd>
        <dt className="text-ink-soft">Member since</dt>
        <dd>{formatDate(user.createdAt)}</dd>
      </dl>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/articles?for=dentist" className="btn">
          Read dentist articles
        </Link>
        <SignOutButton />
      </div>
    </div>
  );
}
