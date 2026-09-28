import Link from 'next/link';

export function Pagination({
  page,
  pageSize,
  total,
  hrefFor,
}: {
  page: number;
  pageSize: number;
  total: number;
  hrefFor: (page: number) => string;
}) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pages" className="mt-8 flex items-center gap-4 text-sm">
      {page > 1 ? (
        <Link className="btn btn-quiet" href={hrefFor(page - 1)}>
          Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-ink-soft">
        Page {page} of {pages}
      </span>
      {page < pages && (
        <Link className="btn btn-quiet" href={hrefFor(page + 1)}>
          Next
        </Link>
      )}
    </nav>
  );
}
