import { and, eq, ne, type SQL } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import { getDb } from '../db';
import { badRequest } from '../http';
import { categories } from '../schema';

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80)
      .replace(/-+$/g, '') || 'item'
  );
}

/**
 * Turns free text into a safe Postgres to_tsquery string with prefix matching,
 * e.g. "bleeding gum" -> "bleeding:* & gum:*". Returns null when no searchable words remain.
 */
export function toPrefixTsQuery(input: string | undefined): string | null {
  if (!input) return null;
  const words = input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((w) => w.length > 1)
    .slice(0, 8);
  if (!words.length) return null;
  return words.map((w) => `${w}:*`).join(' & ');
}

/** Escapes % _ \ for use inside an ILIKE pattern. */
export const likePattern = (q: string) => `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;

/** Finds a slug not used by another row, adding -2, -3... when needed. */
export async function uniqueSlug(
  table: PgTable & { slug: PgColumn; id: PgColumn },
  source: string,
  excludeId?: string,
): Promise<string> {
  const db = getDb();
  const base = slugify(source);
  for (let n = 1; n < 200; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const conditions: SQL[] = [eq(table.slug, candidate)];
    if (excludeId) conditions.push(ne(table.id, excludeId));
    const hit = await db.select({ id: table.id }).from(table).where(and(...conditions)).limit(1);
    if (!hit.length) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export async function assertCategory(categoryId: string) {
  const [cat] = await getDb()
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);
  if (!cat) throw badRequest('Unknown category', { categoryId: 'Choose a topic' });
}
