import Link from 'next/link';
import { disclaimer, site } from '@/site.config';

export function Footer() {
  return (
    <footer className="mt-24 border-t border-rule bg-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <p className="font-serif text-lg font-semibold">{site.name}</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">{disclaimer}</p>
        </div>
        <nav aria-label="Learn" className="grid content-start gap-2 text-sm">
          <Link href="/faq?for=patient" className="hover:underline">Answers for patients</Link>
          <Link href="/faq?for=dentist" className="hover:underline">Answers for dentists</Link>
          <Link href="/articles" className="hover:underline">Articles</Link>
          <Link href="/ask" className="hover:underline">Ask a question</Link>
        </nav>
        <nav aria-label="About" className="grid content-start gap-2 text-sm">
          <Link href="/about" className="hover:underline">About {site.specialist.name}</Link>
          <Link href="/clinics" className="hover:underline">Book a visiting periodontist</Link>
          <Link href="/register" className="hover:underline">Free dentist account</Link>
          <Link href="/privacy" className="hover:underline">Privacy</Link>
        </nav>
      </div>
    </footer>
  );
}
