import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { audienceEnum, contentStatusEnum, type Audience, type ContentStatus } from '../db/schema';

export const trim = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

const tagList = () =>
  Transform(({ value }) =>
    Array.isArray(value)
      ? [...new Set(value.map((t) => String(t).trim().toLowerCase()).filter(Boolean))]
      : value,
  );

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateFaqDto {
  @IsIn(audienceEnum.enumValues)
  audience: Audience;

  @trim() @IsString() @MinLength(5) @MaxLength(300)
  question: string;

  @trim() @IsString() @MinLength(10) @MaxLength(400)
  summary: string;

  /** Markdown */
  @IsString() @MinLength(10) @MaxLength(20000)
  answer: string;

  /** Markdown */
  @IsOptional() @IsString() @MaxLength(5000)
  references?: string | null;

  @IsUUID()
  categoryId: string;

  @IsOptional() @IsArray() @ArrayMaxSize(12) @tagList() @IsString({ each: true }) @MaxLength(40, { each: true })
  tags?: string[];

  @IsOptional() @Matches(SLUG, { message: 'slug may contain lowercase letters, numbers and hyphens' }) @MaxLength(80)
  slug?: string;
}

export class UpdateFaqDto {
  @IsOptional() @IsIn(audienceEnum.enumValues)
  audience?: Audience;

  @IsOptional() @trim() @IsString() @MinLength(5) @MaxLength(300)
  question?: string;

  @IsOptional() @trim() @IsString() @MinLength(10) @MaxLength(400)
  summary?: string;

  @IsOptional() @IsString() @MinLength(10) @MaxLength(20000)
  answer?: string;

  @IsOptional() @IsString() @MaxLength(5000)
  references?: string | null;

  @IsOptional() @IsUUID()
  categoryId?: string;

  @IsOptional() @IsArray() @ArrayMaxSize(12) @tagList() @IsString({ each: true }) @MaxLength(40, { each: true })
  tags?: string[];

  @IsOptional() @Matches(SLUG) @MaxLength(80)
  slug?: string;
}

export class CreateArticleDto {
  @IsIn(audienceEnum.enumValues)
  audience: Audience;

  @trim() @IsString() @MinLength(5) @MaxLength(200)
  title: string;

  @trim() @IsString() @MinLength(10) @MaxLength(400)
  summary: string;

  @IsString() @MinLength(20) @MaxLength(100000)
  body: string;

  @IsOptional() @IsBoolean()
  membersOnly?: boolean;

  @IsUUID()
  categoryId: string;

  @IsOptional() @IsArray() @ArrayMaxSize(12) @tagList() @IsString({ each: true }) @MaxLength(40, { each: true })
  tags?: string[];

  @IsOptional() @Matches(SLUG) @MaxLength(80)
  slug?: string;
}

export class UpdateArticleDto {
  @IsOptional() @IsIn(audienceEnum.enumValues)
  audience?: Audience;

  @IsOptional() @trim() @IsString() @MinLength(5) @MaxLength(200)
  title?: string;

  @IsOptional() @trim() @IsString() @MinLength(10) @MaxLength(400)
  summary?: string;

  @IsOptional() @IsString() @MinLength(20) @MaxLength(100000)
  body?: string;

  @IsOptional() @IsBoolean()
  membersOnly?: boolean;

  @IsOptional() @IsUUID()
  categoryId?: string;

  @IsOptional() @IsArray() @ArrayMaxSize(12) @tagList() @IsString({ each: true }) @MaxLength(40, { each: true })
  tags?: string[];

  @IsOptional() @Matches(SLUG) @MaxLength(80)
  slug?: string;
}

export class AdminContentQuery {
  @IsOptional() @IsIn(contentStatusEnum.enumValues)
  status?: ContentStatus;

  @IsOptional() @IsIn(audienceEnum.enumValues)
  audience?: Audience;

  @IsOptional() @IsIn(['true', 'false'])
  reviewed?: 'true' | 'false';

  @IsOptional() @IsString() @MaxLength(200)
  q?: string;
}
