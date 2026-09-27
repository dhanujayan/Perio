'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ClientError, formValues, send } from '@/lib/client';
import type { AudienceParam } from '@/lib/types';
import { FormError, Honeypot, TextArea, TextField, useHydrated } from './fields';

export function AskForm({ initialAudience }: { initialAudience: AudienceParam }) {
  const [audience, setAudience] = useState<AudienceParam>(initialAudience);
  const [busy, setBusy] = useState(false);
  const hydrated = useHydrated();
  const [error, setError] = useState<ClientError | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const v = formValues(e.currentTarget);
    try {
      await send('/questions', 'POST', {
        name: v.name,
        email: v.email,
        question: v.question,
        audience: audience === 'dentist' ? 'DENTIST' : 'PATIENT',
        ...(v.website ? { website: v.website } : {}),
      });
      setDone(true);
    } catch (err) {
      setError(err as ClientError);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div role="status" className="rounded-lg bg-teal-wash p-6">
        <h2 className="font-serif text-2xl font-semibold">Question received</h2>
        <p className="mt-2 leading-relaxed text-ink-soft">
          Thank you. Questions that many people ask are answered on the site. You will not get a personal reply,
          and nothing here is a diagnosis: for your own mouth, see a dentist.
        </p>
        <Link href={`/faq?for=${audience}`} className="btn mt-5">
          Browse existing answers
        </Link>
      </div>
    );
  }

  return (
    <form method="post" onSubmit={onSubmit} noValidate={false} className="relative grid gap-5">
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-[0.9rem] font-semibold">I am asking as a</legend>
        <div className="flex gap-6">
          {(['patient', 'dentist'] as const).map((a) => (
            <label key={a} className="flex items-center gap-2">
              <input
                type="radio"
                name="audience"
                value={a}
                checked={audience === a}
                onChange={() => setAudience(a)}
                className="accent-[var(--color-gum-deep)]"
              />
              {a === 'patient' ? 'Patient or family member' : 'Dentist or dental student'}
            </label>
          ))}
        </div>
      </fieldset>
      <TextArea
        label="Your question"
        name="question"
        required
        maxLength={2000}
        rows={6}
        hint={
          audience === 'patient'
            ? 'Describe it in general terms. Do not include names, phone numbers or medical records.'
            : 'Clinical questions are welcome. Remove anything that identifies a patient.'
        }
        error={error?.fields?.question}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Your name" name="name" required maxLength={120} autoComplete="name" error={error?.fields?.name} />
        <TextField
          label="Email"
          name="email"
          type="email"
          required
          maxLength={200}
          autoComplete="email"
          hint="Used only if we need to clarify your question."
          error={error?.fields?.email}
        />
      </div>
      <Honeypot />
      <FormError message={error && !error.fields ? error.message : undefined} />
      <div>
        <button className="btn btn-gum" disabled={busy || !hydrated}>
          {busy ? 'Sending…' : 'Send question'}
        </button>
      </div>
    </form>
  );
}
