import { sql } from 'drizzle-orm';
import { getDb } from '@/server/db';
import { handler, json } from '@/server/http';

export const dynamic = 'force-dynamic';

export const GET = handler(async () => {
  await getDb().execute(sql`select 1`);
  return json({ status: 'ok' });
});
