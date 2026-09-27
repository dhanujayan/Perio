'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ClientError, formValues, send } from '@/lib/client';
import { FormError, safeNext, TextField, useHydrated } from './fields';

export function RegisterForm() {
  const params = useSearchParams();
  const [student, setStudent] = useState(false);
  const [busy, setBusy] = useState(false);
  const hydrated = useHydrated();
  const [error, setError] = useState<ClientError | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = formValues(e.currentTarget);
    if (v.password !== v.confirm) {
      setError({ message: 'Passwords do not match', fields: { confirm: 'Passwords do not match' } });
      return;
    }
    if (!v.consent) {
      setError({ message: 'Please agree to the privacy notice to continue' });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await send('/auth/register', 'POST', {
        name: v.name,
        email: v.email,
        password: v.password,
        isStudent: student,
        registrationNo: v.registrationNo || undefined,
        city: v.city || undefined,
      });
      window.location.assign(safeNext(params.get('next'), '/account?welcome=1'));
    } catch (err) {
      setError(err as ClientError);
      setBusy(false);
    }
  }

  const f = error?.fields ?? {};
  return (
    <form method="post" onSubmit={onSubmit} className="grid gap-5">
      <TextField label="Full name" name="name" required maxLength={120} autoComplete="name" error={f.name} />
      <TextField label="Email" name="email" type="email" required maxLength={200} autoComplete="email" error={f.email} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          hint="At least 8 characters."
          error={f.password}
        />
        <TextField label="Confirm password" name="confirm" type="password" required autoComplete="new-password" error={f.confirm} />
      </div>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={student}
          onChange={(e) => setStudent(e.target.checked)}
          className="size-4 accent-[var(--color-teal)]"
        />
        I am a dental student
      </label>
      <TextField
        label={student ? 'College' : 'Dental council registration number'}
        name="registrationNo"
        maxLength={120}
        hint={student ? 'Where you are studying.' : 'Helps us confirm the community is for dental professionals.'}
        error={f.registrationNo}
      />
      <TextField label="City" name="city" maxLength={80} autoComplete="address-level2" error={f.city} />
      <label className="flex items-start gap-2 text-sm leading-relaxed">
        <input type="checkbox" name="consent" value="yes" className="mt-1 size-4 accent-[var(--color-teal)]" />
        <span>
          I agree to the{' '}
          <Link href="/privacy" className="text-teal underline" target="_blank">
            privacy notice
          </Link>
          . My details are used to run my account and tell me about new content and events.
        </span>
      </label>
      <FormError message={error && !error.fields ? error.message : undefined} />
      <button className="btn" disabled={busy || !hydrated}>
        {busy ? 'Creating account…' : 'Create account'}
      </button>
      <p className="text-sm text-ink-soft">
        Already registered?{' '}
        <Link href="/login" className="font-semibold text-teal underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
