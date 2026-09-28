import type { Metadata } from 'next';
import Link from 'next/link';
import { SetupForm } from '@/components/forms/SetupForm';
import { adminExists } from '@/server/services/accounts';

export const metadata: Metadata = { title: 'Set up', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/** First run only: create the specialist's admin account. Closed once an admin exists. */
export default async function SetupPage() {
  const done = await adminExists();
  const enabled = (process.env.SETUP_TOKEN || '').length >= 12;

  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <h1 className="font-serif text-4xl font-semibold tracking-tight">Set up the site</h1>
      {done ? (
        <p className="mt-4 text-lg text-ink-soft">
          Setup is complete.{' '}
          <Link href="/login?next=/admin" className="text-teal underline">
            Sign in to the admin
          </Link>
          .
        </p>
      ) : !enabled ? (
        <p className="mt-4 rounded-md bg-warn-wash px-4 py-3 text-warn">
          Setup is switched off. Add a <strong>SETUP_TOKEN</strong> environment variable (12 or more random
          characters) in the hosting settings, redeploy, then reload this page.
        </p>
      ) : (
        <>
          <p className="mt-3 text-lg leading-relaxed text-ink-soft">
            Create the specialist’s admin account. This page works once: after an admin exists, it closes.
          </p>
          <div className="mt-8">
            <SetupForm />
          </div>
        </>
      )}
    </div>
  );
}
