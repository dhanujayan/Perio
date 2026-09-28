import { requireUser, STAFF } from '@/server/auth';
import { handler, json, readQuery } from '@/server/http';
import { listEnquiries } from '@/server/services/inbox';
import { enquiryFilter } from '@/server/validation';

export const GET = handler(async (req) => {
  await requireUser(req, STAFF);
  return json(await listEnquiries(readQuery(req, enquiryFilter)));
});
