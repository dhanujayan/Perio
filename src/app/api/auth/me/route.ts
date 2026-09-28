import { requireUser } from '@/server/auth';
import { handler, json } from '@/server/http';

export const GET = handler(async (req) => json({ user: await requireUser(req) }));
