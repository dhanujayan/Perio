'use client';

import { useState } from 'react';
import { ClientError, formValues, send } from '@/lib/client';
import { FormError, Honeypot, TextArea, TextField, useHydrated } from './fields';

export function EnquiryForm() {
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
      await send('/enquiries', 'POST', {
        clinicName: v.clinicName,
        contactName: v.contactName,
        email: v.email,
        phone: v.phone,
        city: v.city,
        preferredDates: v.preferredDates || undefined,
        procedures: v.procedures || undefined,
        message: v.message || undefined,
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
        <h2 className="font-serif text-2xl font-semibold">Enquiry sent</h2>
        <p className="mt-2 leading-relaxed text-ink-soft">
          We will contact you by phone or email to discuss dates, cases and fees.
        </p>
      </div>
    );
  }

  const f = error?.fields ?? {};
  return (
    <form method="post" onSubmit={onSubmit} className="relative grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Clinic name" name="clinicName" required maxLength={160} autoComplete="organization" error={f.clinicName} />
        <TextField label="City" name="city" required maxLength={80} autoComplete="address-level2" error={f.city} />
        <TextField label="Contact person" name="contactName" required maxLength={120} autoComplete="name" error={f.contactName} />
        <TextField label="Phone" name="phone" type="tel" required maxLength={30} autoComplete="tel" error={f.phone} />
      </div>
      <TextField label="Email" name="email" type="email" required maxLength={200} autoComplete="email" error={f.email} />
      <TextField
        label="Preferred dates"
        name="preferredDates"
        maxLength={300}
        hint="For example: any Saturday in November, or 12–14 Dec."
        error={f.preferredDates}
      />
      <TextArea
        label="Procedures and number of patients"
        name="procedures"
        maxLength={1000}
        rows={4}
        hint="For example: 3 patients for flap surgery, 1 crown lengthening. Do not include patient names or records here."
        error={f.procedures}
      />
      <TextArea label="Anything else" name="message" maxLength={3000} rows={4} error={f.message} />
      <Honeypot />
      <FormError message={error && !error.fields ? error.message : undefined} />
      <div>
        <button className="btn" disabled={busy || !hydrated}>
          {busy ? 'Sending…' : 'Send enquiry'}
        </button>
      </div>
    </form>
  );
}
