import Link from 'next/link';
import { api } from '@/lib/api';
import type { Stats } from '@/lib/types';

function Stat({ label, value, href, alert }: { label: string; value: number; href: string; alert?: boolean }) {
  return (
    <Link
      href={href}
      className={`block rounded-lg border px-5 py-4 hover:border-teal ${
        alert && value > 0 ? 'border-gum bg-gum-wash' : 'border-rule bg-paper'
      }`}
    >
      <span className="block font-serif text-3xl font-semibold tabular-nums">{value}</span>
      <span className="mt-1 block text-sm text-ink-soft">{label}</span>
    </Link>
  );
}

export default async function AdminHome() {
  const s = await api<Stats>('/admin/stats');
  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold">Overview</h1>

      <h2 className="mt-8 text-sm font-semibold text-ink-soft">Needs attention</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="FAQs awaiting clinical review" value={s.faqs.awaitingReview} href="/admin/faqs?reviewed=false" alert />
        <Stat label="Articles awaiting clinical review" value={s.articles.awaitingReview} href="/admin/articles?reviewed=false" alert />
        <Stat label="New questions" value={s.newQuestions} href="/admin/questions?status=NEW" alert />
        <Stat label="New clinic enquiries" value={s.newEnquiries} href="/admin/enquiries?status=NEW" alert />
      </div>

      <h2 className="mt-10 text-sm font-semibold text-ink-soft">Library</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Published patient FAQs" value={s.faqs.publishedPatient} href="/admin/faqs?audience=PATIENT&status=PUBLISHED" />
        <Stat label="Published dentist FAQs" value={s.faqs.publishedDentist} href="/admin/faqs?audience=DENTIST&status=PUBLISHED" />
        <Stat label="FAQ drafts" value={s.faqs.drafts} href="/admin/faqs?status=DRAFT" />
        <Stat label="Published articles" value={s.articles.published} href="/admin/articles?status=PUBLISHED" />
      </div>

      <h2 className="mt-10 text-sm font-semibold text-ink-soft">Community</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Dentist accounts" value={s.members.total} href="/admin/members" />
        <Stat label="of which students" value={s.members.students} href="/admin/members" />
      </div>
    </div>
  );
}
