import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/site.config';

export const metadata: Metadata = { title: `About ${site.specialist.name}` };

export default function AboutPage() {
  const s = site.specialist;
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">{s.name}</h1>
      <p className="mt-2 text-lg text-ink-soft">
        {s.title}
        {s.qualifications && <>, {s.qualifications}</>}
      </p>
      {s.registration && <p className="mt-1 text-sm text-ink-soft">Registration: {s.registration}</p>}
      <div className="answer mt-8">
        {s.bio.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      <h2 className="mt-12 font-serif text-2xl font-semibold">What this site does</h2>
      <ul className="answer mt-4">
        <li>
          <Link href="/faq?for=patient">Answers for patients</Link> in plain language.
        </li>
        <li>
          <Link href="/faq?for=dentist">Answers for dentists</Link> with references.
        </li>
        <li>
          <Link href="/clinics">Visits to clinics</Link> to treat periodontal cases on site.
        </li>
        <li>Webinars and courses for dentists (coming soon).</li>
      </ul>
    </div>
  );
}
