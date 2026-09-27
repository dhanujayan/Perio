'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatDate } from '@/components/ReviewStatus';
import { ClientError, send } from '@/lib/client';
import type { Category, Enquiry, Question } from '@/lib/types';
import { StatusPill } from './bits';

export function QuestionItem({ q, categories }: { q: Question; categories: Category[] }) {
  const router = useRouter();
  const [status, setStatus] = useState(q.status);
  const [note, setNote] = useState(q.adminNote ?? '');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function update(patch: Partial<Pick<Question, 'status' | 'adminNote'>>) {
    setBusy(true);
    setMsg(null);
    try {
      await send(`/admin/questions/${q.id}`, 'PATCH', patch);
      if (patch.status) setStatus(patch.status);
      setMsg('Saved');
      router.refresh();
    } catch (e) {
      setMsg((e as ClientError).message);
    } finally {
      setBusy(false);
    }
  }

  async function draft() {
    setBusy(true);
    try {
      const faq = await send<{ id: string }>(`/admin/questions/${q.id}/draft-faq`, 'POST', { categoryId });
      router.push(`/admin/faqs/${faq.id}?created=1`);
    } catch (e) {
      setMsg((e as ClientError).message);
      setBusy(false);
    }
  }

  return (
    <li className="grid gap-3 py-5">
      <div className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
        <StatusPill status={status} />
        <span>{q.audience === 'DENTIST' ? 'Dentist' : 'Patient'}</span>
        <span>
          {q.name} &lt;<a href={`mailto:${q.email}`} className="underline">{q.email}</a>&gt;
        </span>
        <span>{formatDate(q.createdAt)}</span>
      </div>
      <p className="max-w-3xl font-serif text-lg leading-relaxed whitespace-pre-wrap">{q.question}</p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="field">
          <label htmlFor={`st-${q.id}`} className="text-xs">Status</label>
          <select id={`st-${q.id}`} className="input py-1.5" value={status} disabled={busy} onChange={(e) => update({ status: e.target.value as Question['status'] })}>
            <option value="NEW">New</option>
            <option value="ANSWERED">Answered</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
        <div className="field min-w-64 flex-1">
          <label htmlFor={`note-${q.id}`} className="text-xs">Private note</label>
          <input id={`note-${q.id}`} className="input py-1.5" value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} onBlur={() => note !== (q.adminNote ?? '') && update({ adminNote: note })} />
        </div>
        {q.faqId ? (
          <Link href={`/admin/faqs/${q.faqId}`} className="btn btn-quiet py-1.5 text-sm">
            Open linked FAQ
          </Link>
        ) : (
          <div className="flex items-end gap-2">
            <div className="field">
              <label htmlFor={`cat-${q.id}`} className="text-xs">Topic</label>
              <select id={`cat-${q.id}`} className="input py-1.5" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <button type="button" className="btn py-1.5 text-sm" disabled={busy} onClick={draft}>
              Start FAQ draft
            </button>
          </div>
        )}
      </div>
      {msg && <p role="status" className="text-sm text-ink-soft">{msg}</p>}
    </li>
  );
}

export function EnquiryItem({ e }: { e: Enquiry }) {
  const router = useRouter();
  const [status, setStatus] = useState(e.status);
  const [note, setNote] = useState(e.adminNote ?? '');
  const [msg, setMsg] = useState<string | null>(null);

  async function update(patch: Partial<Pick<Enquiry, 'status' | 'adminNote'>>) {
    setMsg(null);
    try {
      await send(`/admin/enquiries/${e.id}`, 'PATCH', patch);
      if (patch.status) setStatus(patch.status);
      setMsg('Saved');
      router.refresh();
    } catch (err) {
      setMsg((err as ClientError).message);
    }
  }

  return (
    <li className="grid gap-3 py-5">
      <div className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
        <StatusPill status={status} />
        <span>{formatDate(e.createdAt)}</span>
      </div>
      <div>
        <p className="text-lg font-semibold">
          {e.clinicName}, {e.city}
        </p>
        <p className="text-sm">
          {e.contactName}, <a href={`tel:${e.phone}`} className="underline">{e.phone}</a>,{' '}
          <a href={`mailto:${e.email}`} className="underline">{e.email}</a>
        </p>
      </div>
      <dl className="grid max-w-3xl gap-2 text-[0.95rem] sm:grid-cols-[10rem_1fr]">
        {e.preferredDates && (<><dt className="text-ink-soft">Preferred dates</dt><dd>{e.preferredDates}</dd></>)}
        {e.procedures && (<><dt className="text-ink-soft">Procedures</dt><dd className="whitespace-pre-wrap">{e.procedures}</dd></>)}
        {e.message && (<><dt className="text-ink-soft">Message</dt><dd className="whitespace-pre-wrap">{e.message}</dd></>)}
      </dl>
      <div className="flex flex-wrap items-end gap-3">
        <div className="field">
          <label htmlFor={`est-${e.id}`} className="text-xs">Status</label>
          <select id={`est-${e.id}`} className="input py-1.5" value={status} onChange={(ev) => update({ status: ev.target.value as Enquiry['status'] })}>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
        <div className="field min-w-64 flex-1">
          <label htmlFor={`enote-${e.id}`} className="text-xs">Private note</label>
          <input id={`enote-${e.id}`} className="input py-1.5" value={note} maxLength={2000} onChange={(ev) => setNote(ev.target.value)} onBlur={() => note !== (e.adminNote ?? '') && update({ adminNote: note })} />
        </div>
      </div>
      {msg && <p role="status" className="text-sm text-ink-soft">{msg}</p>}
    </li>
  );
}
