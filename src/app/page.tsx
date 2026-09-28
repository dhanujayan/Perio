import Link from 'next/link';
import { AudienceSwitch } from '@/components/AudienceSwitch';
import { FaqList } from '@/components/FaqList';
import { GumLine } from '@/components/GumLine';
import { SearchBox } from '@/components/SearchBox';
import { api, qs } from '@/lib/api';
import type { AudienceParam, Category, FaqListItem, Paged } from '@/lib/types';
import { toAudience } from '@/lib/types';
import { site } from '@/site.config';

const LEAD: Record<AudienceParam, string> = {
  patient:
    'Bleeding, receding gums and loose teeth are signs of gum disease. It can usually be treated, and treated teeth can often be kept for many years. Start with a question.',
  dentist:
    'Answers on diagnosis, treatment and referral for the periodontally compromised patient, so extraction and implant is a decision rather than the default.',
};

export default async function Home({ searchParams }: { searchParams: Promise<{ for?: string }> }) {
  const { for: forParam } = await searchParams;
  const audience: AudienceParam = forParam === 'dentist' ? 'dentist' : 'patient';
  const apiAudience = toAudience(audience);

  const [faqs, categories] = await Promise.all([
    api<Paged<FaqListItem>>(`/faqs${qs({ audience: apiAudience, pageSize: 6 })}`),
    api<Category[]>(`/categories${qs({ audience: apiAudience })}`),
  ]);
  const topics = categories.filter((c) => c.faqCount > 0);

  return (
    <>
      <section className="bg-enamel">
        <div className="mx-auto max-w-6xl px-5 pt-14 pb-12 sm:pt-20">
          <h1 className="max-w-3xl font-serif text-5xl leading-[1.05] font-semibold tracking-tight sm:text-7xl">
            Can this tooth be saved?
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">{LEAD[audience]}</p>
          <div className="mt-8 grid gap-4">
            <AudienceSwitch current={audience} hrefFor={(a) => (a === 'patient' ? '/' : '/?for=dentist')} />
            <SearchBox audience={audience} />
          </div>
        </div>
        <GumLine />
      </section>

      <div className="bg-paper">
        <section className="mx-auto max-w-6xl px-5 py-14" aria-labelledby="common">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="common" className="font-serif text-3xl font-semibold">
              {audience === 'patient' ? 'What patients ask most' : 'What dentists ask most'}
            </h2>
            <Link href={`/faq?for=${audience}`} className="font-semibold text-teal hover:underline">
              All {faqs.total} answers for {audience === 'patient' ? 'patients' : 'dentists'}
            </Link>
          </div>
          <div className="mt-6">
            <FaqList items={faqs.items} />
          </div>
        </section>

        {topics.length > 0 && (
          <section className="mx-auto max-w-6xl px-5 pb-16" aria-labelledby="topics">
            <h2 id="topics" className="font-serif text-3xl font-semibold">
              Browse by topic
            </h2>
            <ul className="mt-6 grid gap-x-12 sm:grid-cols-2">
              {topics.map((c) => (
                <li key={c.id} className="border-b border-rule">
                  <Link
                    href={`/faq${qs({ for: audience, category: c.slug })}`}
                    className="group flex items-baseline justify-between gap-4 py-4"
                  >
                    <span>
                      <span className="block text-lg font-semibold group-hover:text-teal">{c.name}</span>
                      {c.description && <span className="block text-sm text-ink-soft">{c.description}</span>}
                    </span>
                    <span className="shrink-0 text-sm text-ink-soft tabular-nums">{c.faqCount}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <section className="mx-auto grid max-w-6xl gap-12 px-5 pt-16 md:grid-cols-2">
        <div>
          <h2 className="font-serif text-2xl font-semibold">For dentists and students</h2>
          <p className="mt-3 leading-relaxed text-ink-soft">
            A free account opens case-based articles and checklists, and puts you first in line for webinars and
            courses on periodontal diagnosis, treatment and implants.
          </p>
          <Link href="/register" className="btn mt-5">
            Create a free account
          </Link>
        </div>
        <div>
          <h2 className="font-serif text-2xl font-semibold">For clinics</h2>
          <p className="mt-3 leading-relaxed text-ink-soft">
            No periodontist on your team? {site.specialist.name} visits clinics to treat periodontal cases on site,
            so your patients keep their teeth and stay with your practice.
          </p>
          <Link href="/clinics" className="btn btn-quiet mt-5">
            Request a visit
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pt-16">
        <div className="rounded-lg bg-gum-wash px-6 py-8 sm:px-10">
          <h2 className="font-serif text-2xl font-semibold">Didn’t find your question?</h2>
          <p className="mt-2 max-w-2xl leading-relaxed text-ink-soft">
            Send it in. Common questions are answered on the site, so the next person finds the answer too.
          </p>
          <Link href={`/ask?for=${audience}`} className="btn btn-gum mt-5">
            Ask a question
          </Link>
        </div>
      </section>
    </>
  );
}
