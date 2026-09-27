import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq, sql } from 'drizzle-orm';
import { IsInt, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { InjectDb, type Database } from '../db/db.module';
import { categories, faqs, type Audience } from '../db/schema';
import { slugify } from '../common/util';
import { trim } from './content.dto';

export class CategoryDto {
  @trim() @IsString() @MinLength(2) @MaxLength(80)
  name: string;

  @IsOptional() @IsString() @MaxLength(300)
  description?: string;

  @IsOptional() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) @MaxLength(80)
  slug?: string;

  @IsOptional() @IsInt()
  sortOrder?: number;
}

@Injectable()
export class CategoryService {
  constructor(@InjectDb() private readonly db: Database) {}

  /** Categories with the number of published FAQs in each, optionally for one audience. */
  list(audience?: Audience) {
    const countFilter = audience
      ? sql`${faqs.status} = 'PUBLISHED' and ${faqs.audience} = ${audience}`
      : sql`${faqs.status} = 'PUBLISHED'`;
    return this.db
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

  async create(dto: CategoryDto) {
    const slug = dto.slug || slugify(dto.name);
    const [exists] = await this.db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, slug));
    if (exists) throw new ConflictException('A category with this slug already exists');
    const [row] = await this.db
      .insert(categories)
      .values({ name: dto.name, slug, description: dto.description, sortOrder: dto.sortOrder ?? 0 })
      .returning();
    return row;
  }

  async update(id: string, dto: Partial<CategoryDto>) {
    const [row] = await this.db
      .update(categories)
      .set({
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
      })
      .where(eq(categories.id, id))
      .returning();
    if (!row) throw new NotFoundException('Category not found');
    return row;
  }
}
