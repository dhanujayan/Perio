export function formatDate(iso: string | null | undefined) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(iso),
  );
}

/** States whether a periodontist has checked this content, and when. */
export function ReviewStatus({
  reviewedAt,
  reviewerName,
  updatedAt,
}: {
  reviewedAt: string | null;
  reviewerName: string | null;
  updatedAt: string;
}) {
  if (reviewedAt) {
    return (
      <p className="text-sm text-ink-soft">
        <span className="font-semibold text-teal">Clinically reviewed</span>
        {reviewerName ? ` by ${reviewerName}` : ''} on {formatDate(reviewedAt)}. Last updated{' '}
        {formatDate(updatedAt)}.
      </p>
    );
  }
  return (
    <p className="rounded-md bg-warn-wash px-3 py-2 text-sm text-warn">
      <span className="font-semibold">Awaiting clinical review.</span> A periodontist has not yet checked this
      answer. Last updated {formatDate(updatedAt)}.
    </p>
  );
}
