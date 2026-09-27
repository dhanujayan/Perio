import type { Metadata } from 'next';
import { EnquiryForm } from '@/components/forms/EnquiryForm';
import { site } from '@/site.config';

export const metadata: Metadata = {
  title: 'Book a visiting periodontist',
  description: `Clinics can request ${site.specialist.name} to treat periodontal cases on site.`,
};

const STEPS = [
  { title: 'Send an enquiry', body: 'Tell us your city, preferred dates and the cases you have in mind.' },
  { title: 'Share the cases', body: 'We agree how to share X-rays and charts securely, and review them before the visit.' },
  { title: 'Confirm the visit', body: 'You receive a quote for the visit, procedures and travel, and we fix the date.' },
  { title: 'Treatment at your clinic', body: 'Procedures are done in your chairs, with post-op instructions and a follow-up plan for your team.' },
];

export default function ClinicsPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
        <div>
          <h1 className="font-serif text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
            A periodontist for your clinic, when you need one
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            Many clinics do not have a periodontist on staff, so patients are referred elsewhere or teeth are
            extracted. {site.specialist.name} visits clinics to treat periodontal cases on site: patients keep
            their teeth and stay with your practice.
          </p>
          <h2 className="mt-10 text-sm font-semibold text-ink-soft">How it works</h2>
          <ol className="mt-3 grid gap-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="grid grid-cols-[2rem_1fr] gap-3">
                <span className="grid size-8 place-items-center rounded-full bg-gum-wash font-semibold text-gum-deep tabular-nums">
                  {i + 1}
                </span>
                <span>
                  <span className="block font-semibold">{s.title}</span>
                  <span className="block text-ink-soft">{s.body}</span>
                </span>
              </li>
            ))}
          </ol>
          <h2 className="mt-10 text-sm font-semibold text-ink-soft">Typical procedures</h2>
          <p className="mt-2 leading-relaxed">
            Periodontal flap surgery, regenerative surgery, crown lengthening, gingival grafting, scaling and root
            planing for advanced cases, and implant planning for periodontal patients.
          </p>
        </div>
        <section aria-labelledby="enquire" className="rounded-lg border border-rule bg-paper p-6 sm:p-8">
          <h2 id="enquire" className="font-serif text-2xl font-semibold">
            Request a visit
          </h2>
          <p className="mt-1 mb-6 text-sm text-ink-soft">No commitment. We will contact you to discuss.</p>
          <EnquiryForm />
        </section>
      </div>
    </div>
  );
}
