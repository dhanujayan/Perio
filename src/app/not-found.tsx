import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-20">
      <h1 className="font-serif text-4xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-3 text-lg text-ink-soft">
        The page may have moved, or the question may have been updated. Try searching instead.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/faq" className="btn">
          Browse questions
        </Link>
        <Link href="/" className="btn btn-quiet">
          Home
        </Link>
      </div>
    </div>
  );
}
