import { Injectable } from '@nestjs/common';
import { and, eq, ne, SQL } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import { InjectDb, type Database } from '../db/db.module';
import { slugify } from '../common/util';

/** Finds a slug not used by another row in the table, adding -2, -3... when needed. */
@Injectable()
export class SlugService {
  constructor(@InjectDb() private readonly db: Database) {}

  async unique(
    table: PgTable & { slug: PgColumn; id: PgColumn },
    source: string,
    excludeId?: string,
  ): Promise<string> {
    const base = slugify(source);
    for (let n = 1; n < 200; n++) {
      const candidate = n === 1 ? base : `${base}-${n}`;
      const conditions: SQL[] = [eq(table.slug, candidate)];
      if (excludeId) conditions.push(ne(table.id, excludeId));
      const hit = await this.db
        .select({ id: table.id })
        .from(table)
        .where(and(...conditions))
        .limit(1);
      if (!hit.length) return candidate;
    }
    return `${base}-${Date.now()}`;
  }
}
