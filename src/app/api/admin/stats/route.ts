import { requireUser, STAFF } from '@/server/auth';
import { handler, json } from '@/server/http';
import { adminStats } from '@/server/services/inbox';

export const GET = handler(async (req) => {
  await requireUser(req, STAFF);
  return json(await adminStats());
});
