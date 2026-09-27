import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { audienceEnum, type Audience } from '../db/schema';

export class PageQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  pageSize = 20;
}

export class ContentListQuery extends PageQuery {
  @IsOptional() @IsIn(audienceEnum.enumValues)
  audience?: Audience;

  /** Category slug */
  @IsOptional() @IsString() @MaxLength(80)
  category?: string;

  @IsOptional() @IsString() @MaxLength(200)
  q?: string;
}

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
