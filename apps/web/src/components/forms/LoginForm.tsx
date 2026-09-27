'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ClientError, formValues, send } from '@/lib/client';
import type { SessionUser } from '@/lib/types';
import { FormError, safeNext, TextField, useHydrated } from './fields';

export function LoginForm() {
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const hydrated = useHydrated();
  const [error, setError] = useState<ClientError | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const v = formValues(e.currentTarget);
    try {
      const { user } = await send<{ user: SessionUser }>('/auth/login', 'POST', {
        email: v.email,
        password: v.password,
      });
      const staff = user.role === 'ADMIN' || user.role === 'STAFF';
      // Full page load so the header and server components see the new session
      window.location.assign(safeNext(params.get('next'), staff ? '/admin' : '/'));
    } catch (err) {
      setError(err as ClientError);
      setBusy(false);
    }
  }

  return (
    <form method="post" onSubmit={onSubmit} className="grid gap-5">
      <TextField label="Email" name="email" type="email" required autoComplete="email" error={error?.fields?.email} />
      <TextField
        label="Password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        error={error?.fields?.password}
      />
      <FormError message={error && !error.fields ? error.message : undefined} />
      <button className="btn" disabled={busy || !hydrated}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="text-sm text-ink-soft">
        No account?{' '}
        <Link href={`/register${params.get('next') ? `?next=${encodeURIComponent(params.get('next')!)}` : ''}`} className="font-semibold text-teal underline">
          Create a free dentist account
        </Link>
      </p>
    </form>
  );
}
