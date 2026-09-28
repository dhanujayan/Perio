import { ADMIN_ONLY, requireUser, STAFF } from '@/server/auth';
import { assertUuid, handler, json, notFound } from '@/server/http';
import { markFaqReviewed, setFaqStatus } from '@/server/services/faqs';

const STATUS = { publish: 'PUBLISHED', unpublish: 'DRAFT', archive: 'ARCHIVED' } as const;

/** POST /api/admin/faqs/:id/publish | unpublish | archive | review */
export const POST = handler<{ id: string; action: string }>(async (req, { id, action }) => {
  assertUuid(id);
  if (action === 'review') {
    // Only the specialist can confirm clinical review
    const user = await requireUser(req, ADMIN_ONLY);
    return json(await markFaqReviewed(id, user.id));
  }
  if (!(action in STATUS)) throw notFound();
  await requireUser(req, STAFF);
  return json(await setFaqStatus(id, STATUS[action as keyof typeof STATUS]));
});
