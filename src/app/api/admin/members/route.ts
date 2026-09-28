import { ADMIN_ONLY, requireUser } from '@/server/auth';
import { handler, json, readQuery } from '@/server/http';
import { listMembers } from '@/server/services/inbox';
import { pageQuery } from '@/server/validation';

/** Registered dentists and students; personal data, so specialist only. */
export const GET = handler(async (req) => {
  await requireUser(req, ADMIN_ONLY);
  return json(await listMembers(readQuery(req, pageQuery)));
});
