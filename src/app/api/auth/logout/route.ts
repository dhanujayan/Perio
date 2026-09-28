import { clearedSessionCookie } from '@/server/auth';
import { handler, noContent } from '@/server/http';

export const POST = handler(async () => noContent({ 'set-cookie': clearedSessionCookie() }));
