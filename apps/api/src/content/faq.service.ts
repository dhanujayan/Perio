import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, ilike, isNotNull, isNull, ne, or, sql, SQL } from 'drizzle-orm';
import { InjectDb, type Database } from '../db/db.module';
import { categories, faqs, users, type Faq } from '../db/schema';
import { ContentListQuery, Paged, toPrefixTsQuery } from '../common/util';
import { AdminContentQuery, CreateFaqDto, UpdateFaqDto } from './content.dto';
import { SlugService } from './slug.service';

const faqVector = sql`to_tsvector('english', ${faqs.question} || ' ' || ${faqs.summary} || ' ' || ${faqs.answer})`;

// Changing any of these on a reviewed FAQ clears its clinical review
const CLINICAL_FIELDS: (keyof UpdateFaqDto)[] = ['question', 'summary', 'answer', 'references', 'audience'];

const listColumns = {
  id: faqs.id,
  slug: faqs.slug,
  audience: faqs.audience,
  question: faqs.question,
  summary: faqs.summary,
  tags: faqs.tags,
  reviewedAt: faqs.reviewedAt,
  updatedAt: faqs.updatedAt,
  category: { slug: categories.slug, name: categories.name },
};

@Injectable()
export class FaqService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly slugs: SlugService,
  ) {}

  // ---------- Public ----------

  async listPublished(query: ContentListQuery): Promise<Paged<unknown>> {
    const tsq = toPrefixTsQuery(query.q);
    if (query.q && !tsq) return { items: [], total: 0, page: query.page, pageSize: query.pageSize };

    const where: SQL[] = [eq(faqs.status, 'PUBLISHED')];
    if (query.audience) where.push(eq(faqs.audience, query.audience));
    if (query.category) where.push(eq(categories.slug, query.category));
    if (tsq) where.push(sql`${faqVector} @@ to_tsquery('english', ${tsq})`);

    const order = tsq
      ? [desc(sql`ts_rank(${faqVector}, to_tsquery('english', ${tsq}))`), desc(faqs.viewCount)]
      : [asc(categories.sortOrder), desc(faqs.viewCount), asc(faqs.question)];

    const [items, [{ total }]] = await Promise.all([
      this.db
        .select(listColumns)
        .from(faqs)
        .innerJoin(categories, eq(faqs.categoryId, categories.id))
        .where(and(...where))
        .orderBy(...order)
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      this.db
        .select({ total: sql<number>`count(*)::int` })
        .from(faqs)
        .innerJoin(categories, eq(faqs.categoryId, categories.id))
        .where(and(...where)),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async getPublished(slug: string) {
    const [row] = await this.db
      .select({
        faq: faqs,
        category: { id: categories.id, slug: categories.slug, name: categories.name },
        reviewerName: users.name,
      })
      .from(faqs)
      .innerJoin(categories, eq(faqs.categoryId, categories.id))
      .leftJoin(users, eq(faqs.reviewedById, users.id))
      .where(and(eq(faqs.slug, slug), eq(faqs.status, 'PUBLISHED')))
      .limit(1);
    if (!row) throw new NotFoundException('Question not found');

    const related = await this.db
      .select(listColumns)
      .from(faqs)
      .innerJoin(categories, eq(faqs.categoryId, categories.id))
      .where(
        and(
          eq(faqs.status, 'PUBLISHED'),
          eq(faqs.categoryId, row.faq.categoryId),
          eq(faqs.audience, row.faq.audience),
          ne(faqs.id, row.faq.id),
        ),
      )
      .orderBy(desc(faqs.viewCount))
      .limit(5);

    // Counting views is best-effort and must not slow the response
    void this.db
      .update(faqs)
      .set({ viewCount: sql`${faqs.viewCount} + 1`, updatedAt: sql`${faqs.updatedAt}` })
      .where(eq(faqs.id, row.faq.id))
      .catch(() => undefined);

    const { reviewedById: _r, viewCount: _v, status: _s, ...faq } = row.faq;
    return { ...faq, category: row.category, reviewerName: row.reviewerName, related };
  }

  /** Every published FAQ slug, for the sitemap. */
  sitemap() {
    return this.db
      .select({ slug: faqs.slug, updatedAt: faqs.updatedAt })
      .from(faqs)
      .where(eq(faqs.status, 'PUBLISHED'));
  }

  // ---------- Admin ----------

  async adminList(query: AdminContentQuery) {
    const where: SQL[] = [];
    if (query.status) where.push(eq(faqs.status, query.status));
    if (query.audience) where.push(eq(faqs.audience, query.audience));
    if (query.reviewed === 'true') where.push(isNotNull(faqs.reviewedAt));
    if (query.reviewed === 'false') where.push(isNull(faqs.reviewedAt));
    if (query.q) {
      const like = `%${query.q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
      where.push(or(ilike(faqs.question, like), ilike(faqs.summary, like))!);
    }
    return this.db
      .select({
        ...listColumns,
        status: faqs.status,
        viewCount: faqs.viewCount,
        publishedAt: faqs.publishedAt,
      })
      .from(faqs)
      .innerJoin(categories, eq(faqs.categoryId, categories.id))
      .where(where.length ? and(...where) : undefined)
      .orderBy(desc(faqs.updatedAt))
      .limit(500);
  }

  async adminGet(id: string) {
    const [row] = await this.db
      .select({ faq: faqs, reviewerName: users.name })
      .from(faqs)
      .leftJoin(users, eq(faqs.reviewedById, users.id))
      .where(eq(faqs.id, id))
      .limit(1);
    if (!row) throw new NotFoundException('FAQ not found');
    return { ...row.faq, reviewerName: row.reviewerName };
  }

  async create(dto: CreateFaqDto) {
    await this.assertCategory(dto.categoryId);
    const slug = await this.slugs.unique(faqs, dto.slug || dto.question);
    const [row] = await this.db
      .insert(faqs)
      .values({
        slug,
        audience: dto.audience,
        question: dto.question,
        summary: dto.summary,
        answer: dto.answer,
        references: dto.references || null,
        categoryId: dto.categoryId,
        tags: dto.tags ?? [],
        status: 'DRAFT',
      })
      .returning();
    return row;
  }

  async update(id: string, dto: UpdateFaqDto) {
    const current = await this.adminGet(id);
    if (dto.categoryId) await this.assertCategory(dto.categoryId);

    const patch: Partial<Faq> = {};
    for (const key of Object.keys(dto) as (keyof UpdateFaqDto)[]) {
      if (dto[key] !== undefined) (patch as Record<string, unknown>)[key] = dto[key];
    }
    if (dto.slug && dto.slug !== current.slug) {
      patch.slug = await this.slugs.unique(faqs, dto.slug, id);
    }
    const clinicalChange = CLINICAL_FIELDS.some(
      (k) => dto[k] !== undefined && dto[k] !== (current as Record<string, unknown>)[k],
    );
    if (clinicalChange && current.reviewedAt) {
      patch.reviewedAt = null;
      patch.reviewedById = null;
    }
    const [row] = await this.db.update(faqs).set(patch).where(eq(faqs.id, id)).returning();
    return { ...row, reviewCleared: clinicalChange && !!current.reviewedAt };
  }

  async setStatus(id: string, status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED') {
    const current = await this.adminGet(id);
    const [row] = await this.db
      .update(faqs)
      .set({
        status,
        publishedAt: status === 'PUBLISHED' ? (current.publishedAt ?? new Date()) : current.publishedAt,
      })
      .where(eq(faqs.id, id))
      .returning();
    return row;
  }

  async markReviewed(id: string, reviewerId: string) {
    await this.adminGet(id);
    const [row] = await this.db
      .update(faqs)
      .set({ reviewedAt: new Date(), reviewedById: reviewerId })
      .where(eq(faqs.id, id))
      .returning();
    return row;
  }

  async remove(id: string) {
    await this.adminGet(id);
    await this.db.delete(faqs).where(eq(faqs.id, id));
  }

  private async assertCategory(categoryId: string) {
    const [cat] = await this.db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);
    if (!cat) throw new BadRequestException('Unknown category');
  }
}
