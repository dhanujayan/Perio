'use client';

import { useState } from 'react';
import { ClientError, formValues, send } from '@/lib/client';
import { FormError, TextField, useHydrated } from './fields';

export function SetupForm() {
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
    setBusy(true);
    setError(null);
    try {
      await send('/auth/setup', 'POST', { token: v.token, name: v.name, email: v.email, password: v.password });
      window.location.assign('/admin');
    } catch (err) {
      setError(err as ClientError);
      setBusy(false);
    }
  }

  const f = error?.fields ?? {};
  return (
    <form method="post" onSubmit={onSubmit} className="grid gap-5">
      <TextField
        label="Setup code"
        name="token"
        type="password"
        required
        autoComplete="off"
        hint="The SETUP_TOKEN value from the Netlify site settings."
        error={f.token}
      />
      <TextField label="Your name" name="name" required maxLength={120} autoComplete="name" defaultValue="Dr Ashlee Shailesh" error={f.name} />
      <TextField label="Email" name="email" type="email" required maxLength={200} autoComplete="email" error={f.email} />
      <div className="grid items-end gap-5 sm:grid-cols-2">
        <TextField label="Password" name="password" type="password" required minLength={10} autoComplete="new-password" hint="At least 10 characters." error={f.password} />
        <TextField label="Confirm password" name="confirm" type="password" required autoComplete="new-password" error={f.confirm} />
      </div>
      <FormError message={error && !error.fields ? error.message : undefined} />
      <button className="btn" disabled={busy || !hydrated}>
        {busy ? 'Creating account…' : 'Create admin account'}
      </button>
    </form>
  );
}
