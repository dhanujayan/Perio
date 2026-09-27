import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, ilike, isNotNull, isNull, or, sql, SQL } from 'drizzle-orm';
import { InjectDb, type Database } from '../db/db.module';
import { articles, categories, users, type Article } from '../db/schema';
import { ContentListQuery, Paged, toPrefixTsQuery } from '../common/util';
import type { SessionUser } from '../auth/decorators';
import { AdminContentQuery, CreateArticleDto, UpdateArticleDto } from './content.dto';
import { SlugService } from './slug.service';

const articleVector = sql`to_tsvector('english', ${articles.title} || ' ' || ${articles.summary} || ' ' || ${articles.body})`;
const CLINICAL_FIELDS: (keyof UpdateArticleDto)[] = ['title', 'summary', 'body', 'audience'];

const listColumns = {
  id: articles.id,
  slug: articles.slug,
  audience: articles.audience,
  title: articles.title,
  summary: articles.summary,
  membersOnly: articles.membersOnly,
  tags: articles.tags,
  reviewedAt: articles.reviewedAt,
  publishedAt: articles.publishedAt,
  updatedAt: articles.updatedAt,
  category: { slug: categories.slug, name: categories.name },
};

@Injectable()
export class ArticleService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly slugs: SlugService,
  ) {}

  async listPublished(query: ContentListQuery): Promise<Paged<unknown>> {
    const tsq = toPrefixTsQuery(query.q);
    if (query.q && !tsq) return { items: [], total: 0, page: query.page, pageSize: query.pageSize };

    const where: SQL[] = [eq(articles.status, 'PUBLISHED')];
    if (query.audience) where.push(eq(articles.audience, query.audience));
    if (query.category) where.push(eq(categories.slug, query.category));
    if (tsq) where.push(sql`${articleVector} @@ to_tsquery('english', ${tsq})`);

    const order = tsq
      ? [desc(sql`ts_rank(${articleVector}, to_tsquery('english', ${tsq}))`)]
      : [desc(articles.publishedAt)];

    const [items, [{ total }]] = await Promise.all([
      this.db
        .select(listColumns)
        .from(articles)
        .innerJoin(categories, eq(articles.categoryId, categories.id))
        .where(and(...where))
        .orderBy(...order)
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      this.db
        .select({ total: sql<number>`count(*)::int` })
        .from(articles)
        .innerJoin(categories, eq(articles.categoryId, categories.id))
        .where(and(...where)),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  /** Members-only bodies are withheld from signed-out visitors. */
  async getPublished(slug: string, user?: SessionUser) {
    const [row] = await this.db
      .select({
        article: articles,
        category: { id: categories.id, slug: categories.slug, name: categories.name },
        reviewerName: users.name,
      })
      .from(articles)
      .innerJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(users, eq(articles.reviewedById, users.id))
      .where(and(eq(articles.slug, slug), eq(articles.status, 'PUBLISHED')))
      .limit(1);
    if (!row) throw new NotFoundException('Article not found');

    const { reviewedById: _r, status: _s, ...article } = row.article;
    const locked = article.membersOnly && !user;
    return {
      ...article,
      body: locked ? null : article.body,
      locked,
      category: row.category,
      reviewerName: row.reviewerName,
    };
  }

  sitemap() {
    return this.db
      .select({ slug: articles.slug, updatedAt: articles.updatedAt })
      .from(articles)
      .where(eq(articles.status, 'PUBLISHED'));
  }

  // ---------- Admin ----------

  adminList(query: AdminContentQuery) {
    const where: SQL[] = [];
    if (query.status) where.push(eq(articles.status, query.status));
    if (query.audience) where.push(eq(articles.audience, query.audience));
    if (query.reviewed === 'true') where.push(isNotNull(articles.reviewedAt));
    if (query.reviewed === 'false') where.push(isNull(articles.reviewedAt));
    if (query.q) {
      const like = `%${query.q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
      where.push(or(ilike(articles.title, like), ilike(articles.summary, like))!);
    }
    return this.db
      .select({ ...listColumns, status: articles.status })
      .from(articles)
      .innerJoin(categories, eq(articles.categoryId, categories.id))
      .where(where.length ? and(...where) : undefined)
      .orderBy(desc(articles.updatedAt))
      .limit(500);
  }

  async adminGet(id: string) {
    const [row] = await this.db
      .select({ article: articles, reviewerName: users.name })
      .from(articles)
      .leftJoin(users, eq(articles.reviewedById, users.id))
      .where(eq(articles.id, id))
      .limit(1);
    if (!row) throw new NotFoundException('Article not found');
    return { ...row.article, reviewerName: row.reviewerName };
  }

  async create(dto: CreateArticleDto) {
    await this.assertCategory(dto.categoryId);
    const slug = await this.slugs.unique(articles, dto.slug || dto.title);
    const [row] = await this.db
      .insert(articles)
      .values({
        slug,
        audience: dto.audience,
        title: dto.title,
        summary: dto.summary,
        body: dto.body,
        membersOnly: dto.membersOnly ?? false,
        categoryId: dto.categoryId,
        tags: dto.tags ?? [],
        status: 'DRAFT',
      })
      .returning();
    return row;
  }

  async update(id: string, dto: UpdateArticleDto) {
    const current = await this.adminGet(id);
    if (dto.categoryId) await this.assertCategory(dto.categoryId);

    const patch: Partial<Article> = {};
    for (const key of Object.keys(dto) as (keyof UpdateArticleDto)[]) {
      if (dto[key] !== undefined) (patch as Record<string, unknown>)[key] = dto[key];
    }
    if (dto.slug && dto.slug !== current.slug) {
      patch.slug = await this.slugs.unique(articles, dto.slug, id);
    }
    const clinicalChange = CLINICAL_FIELDS.some(
      (k) => dto[k] !== undefined && dto[k] !== (current as Record<string, unknown>)[k],
    );
    if (clinicalChange && current.reviewedAt) {
      patch.reviewedAt = null;
      patch.reviewedById = null;
    }
    const [row] = await this.db.update(articles).set(patch).where(eq(articles.id, id)).returning();
    return { ...row, reviewCleared: clinicalChange && !!current.reviewedAt };
  }

  async setStatus(id: string, status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED') {
    const current = await this.adminGet(id);
    const [row] = await this.db
      .update(articles)
      .set({
        status,
        publishedAt: status === 'PUBLISHED' ? (current.publishedAt ?? new Date()) : current.publishedAt,
      })
      .where(eq(articles.id, id))
      .returning();
    return row;
  }

  async markReviewed(id: string, reviewerId: string) {
    await this.adminGet(id);
    const [row] = await this.db
      .update(articles)
      .set({ reviewedAt: new Date(), reviewedById: reviewerId })
      .where(eq(articles.id, id))
      .returning();
    return row;
  }

  async remove(id: string) {
    await this.adminGet(id);
    await this.db.delete(articles).where(eq(articles.id, id));
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
