import { asc, eq, sql } from 'drizzle-orm';
import type { z } from 'zod';
import { getDb } from '../db';
import { HttpError, notFound } from '../http';
import { categories, faqs, type Audience } from '../schema';
import type { categorySchema } from '../validation';
import { slugify } from './util';

/** Topics with the number of published FAQs in each, optionally for one audience. */
export function listCategories(audience?: Audience) {
  const countFilter = audience
    ? sql`${faqs.status} = 'PUBLISHED' and ${faqs.audience} = ${audience}`
    : sql`${faqs.status} = 'PUBLISHED'`;
  return getDb()
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      description: categories.description,
      sortOrder: categories.sortOrder,
      faqCount: sql<number>`count(${faqs.id}) filter (where ${countFilter})::int`,
    })
    .from(categories)
    .leftJoin(faqs, eq(faqs.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

type CategoryInput = z.infer<typeof categorySchema>;

export async function createCategory(dto: CategoryInput) {
  const db = getDb();
  const slug = dto.slug || slugify(dto.name);
  const [exists] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug));
  if (exists) throw new HttpError(409, 'A topic with this web address already exists');
  const [row] = await db
    .insert(categories)
    .values({ name: dto.name, slug, description: dto.description, sortOrder: dto.sortOrder ?? 0 })
    .returning();
  return row;
}

export async function updateCategory(id: string, dto: Partial<CategoryInput>) {
  const [row] = await getDb()
    .update(categories)
    .set({
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      ...(dto.slug !== undefined && { slug: dto.slug }),
    })
    .where(eq(categories.id, id))
    .returning();
  if (!row) throw notFound('Topic not found');
  return row;
}
