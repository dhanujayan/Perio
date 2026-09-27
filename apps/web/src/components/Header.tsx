import Link from 'next/link';
import { site } from '@/site.config';
import type { SessionUser } from '@/lib/types';

const NAV = [
  { href: '/faq', label: 'Questions' },
  { href: '/articles', label: 'Articles' },
  { href: '/clinics', label: 'For clinics' },
  { href: '/about', label: 'About' },
];

export function Header({ user }: { user: SessionUser | null }) {
  const isStaff = user && (user.role === 'ADMIN' || user.role === 'STAFF');
  return (
    <header className="border-b border-rule bg-enamel">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:rounded focus:bg-paper focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-5 py-4">
        <Link href="/" className="font-serif text-xl font-semibold tracking-tight">
          {site.name}
        </Link>
        <nav aria-label="Main" className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto text-[0.95rem] sm:order-none sm:w-auto">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap rounded px-2 py-1 text-ink-soft hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-[0.95rem]">
          {isStaff && (
            <Link href="/admin" className="rounded px-2 py-1 font-semibold text-teal hover:underline">
              Admin
            </Link>
          )}
          {user ? (
            <Link href="/account" className="rounded px-2 py-1 text-ink-soft hover:text-ink">
              {user.name.split(' ')[0]}
            </Link>
          ) : (
            <>
              <Link href="/login" className="rounded px-2 py-1 text-ink-soft hover:text-ink">
                Sign in
              </Link>
              <Link href="/register" className="btn btn-quiet py-1.5 text-sm">
                Dentist sign-up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
