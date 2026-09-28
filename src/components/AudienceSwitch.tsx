import Link from 'next/link';
import type { AudienceParam } from '@/lib/types';

const OPTIONS: { value: AudienceParam; label: string }[] = [
  { value: 'patient', label: 'I’m a patient' },
  { value: 'dentist', label: 'I’m a dentist' },
];

/** Two-way switch between the patient and dentist tracks. Plain links, so it works without JavaScript. */
export function AudienceSwitch({
  current,
  hrefFor,
  label = 'Show answers for',
}: {
  current: AudienceParam;
  hrefFor: (a: AudienceParam) => string;
  label?: string;
}) {
  return (
    <nav aria-label={label} className="inline-flex w-fit rounded-full border border-rule bg-paper p-1">
      {OPTIONS.map((o) => {
        const active = o.value === current;
        return (
          <Link
            key={o.value}
            href={hrefFor(o.value)}
            aria-current={active ? 'page' : undefined}
            scroll={false}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              active ? 'bg-gum-deep text-white' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {o.label}
          </Link>
        );
      })}
    </nav>
  );
}
