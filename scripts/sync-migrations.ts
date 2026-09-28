/**
 * Copies the SQL migrations drizzle-kit writes to ./drizzle into netlify/database/migrations,
 * where Netlify Database applies them automatically before each deploy goes live.
 * (drizzle-kit also writes a meta/ folder; Netlify must not see that, so it stays in ./drizzle.)
 */
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '..');
const from = path.join(root, 'drizzle');
const to = path.join(root, 'netlify/database/migrations');
mkdirSync(to, { recursive: true });

const files = readdirSync(from).filter((f) => /^\d+_[a-z0-9_-]+\.sql$/.test(f));
for (const f of files) copyFileSync(path.join(from, f), path.join(to, f));
console.log(`Synced ${files.length} migrations to netlify/database/migrations`);
