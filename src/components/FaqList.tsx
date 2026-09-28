import Link from 'next/link';
import type { FaqListItem } from '@/lib/types';

/** A text-first list of questions, like an index: question, one-line answer, topic. */
export function FaqList({ items, showCategory = true }: { items: FaqListItem[]; showCategory?: boolean }) {
  return (
    <ul className="divide-y divide-rule border-y border-rule">
      {items.map((f) => (
        <li key={f.id}>
          <Link href={`/faq/${f.slug}`} className="group block py-5">
            <h3 className="font-serif text-xl leading-snug font-semibold group-hover:text-teal">{f.question}</h3>
            <p className="mt-1.5 max-w-3xl leading-relaxed text-ink-soft">{f.summary}</p>
            {showCategory && <p className="mt-2 text-sm text-ink-soft">{f.category.name}</p>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
