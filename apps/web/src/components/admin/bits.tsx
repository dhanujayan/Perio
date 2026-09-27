import Link from 'next/link';
import type { ContentStatus } from '@/lib/types';

export function StatusPill({ status }: { status: ContentStatus | string }) {
  const styles: Record<string, string> = {
    PUBLISHED: 'bg-teal-wash text-teal',
    DRAFT: 'bg-warn-wash text-warn',
    ARCHIVED: 'bg-rule/60 text-ink-soft',
    NEW: 'bg-gum-wash text-gum-deep',
    ANSWERED: 'bg-teal-wash text-teal',
    CONTACTED: 'bg-teal-wash text-teal',
    CLOSED: 'bg-rule/60 text-ink-soft',
  };
  const label = status.charAt(0) + status.slice(1).toLowerCase();
  return (
    <span className={`inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-semibold ${styles[status] ?? ''}`}>{label}</span>
  );
}

export function ReviewPill({ reviewedAt }: { reviewedAt: string | null }) {
  return reviewedAt ? (
    <span className="inline-block whitespace-nowrap rounded bg-teal-wash px-1.5 py-0.5 text-xs font-semibold text-teal">Reviewed</span>
  ) : (
    <span className="inline-block whitespace-nowrap rounded bg-warn-wash px-1.5 py-0.5 text-xs font-semibold text-warn">Needs review</span>
  );
}

/** A row of filter links that keeps the other active filters. */
export function FilterLinks({
  base,
  current,
  param,
  options,
}: {
  base: string;
  current: Record<string, string | undefined>;
  param: string;
  options: { value?: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-1 text-sm">
      {options.map((o) => {
        const next = new URLSearchParams(
          Object.entries({ ...current, [param]: o.value }).filter(([, v]) => v) as [string, string][],
        );
        const active = (current[param] ?? undefined) === o.value;
        return (
          <Link
            key={o.label}
            href={`${base}${next.toString() ? `?${next}` : ''}`}
            aria-current={active ? 'true' : undefined}
            className={`rounded-full border px-3 py-1 ${
              active ? 'border-ink bg-ink text-white' : 'border-rule hover:border-teal'
            }`}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}
