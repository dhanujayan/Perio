import { ADMIN_ONLY, requireUser, STAFF } from '@/server/auth';
import { assertUuid, handler, json, notFound } from '@/server/http';
import { markArticleReviewed, setArticleStatus } from '@/server/services/articles';

const STATUS = { publish: 'PUBLISHED', unpublish: 'DRAFT', archive: 'ARCHIVED' } as const;

export const POST = handler<{ id: string; action: string }>(async (req, { id, action }) => {
  assertUuid(id);
  if (action === 'review') {
    const user = await requireUser(req, ADMIN_ONLY);
    return json(await markArticleReviewed(id, user.id));
  }
  if (!(action in STATUS)) throw notFound();
  await requireUser(req, STAFF);
  return json(await setArticleStatus(id, STATUS[action as keyof typeof STATUS]));
});
