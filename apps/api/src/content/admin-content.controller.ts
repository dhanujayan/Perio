import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { IsInt, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { CurrentUser, Roles, type SessionUser } from '../auth/decorators';
import { ArticleService } from './article.service';
import { CategoryDto, CategoryService } from './category.service';
import {
  AdminContentQuery,
  CreateArticleDto,
  CreateFaqDto,
  trim,
  UpdateArticleDto,
  UpdateFaqDto,
} from './content.dto';
import { FaqService } from './faq.service';

class UpdateCategoryDto {
  @IsOptional() @trim() @IsString() @MinLength(2) @MaxLength(80)
  name?: string;

  @IsOptional() @IsString() @MaxLength(300)
  description?: string;

  @IsOptional() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) @MaxLength(80)
  slug?: string;

  @IsOptional() @IsInt()
  sortOrder?: number;
}

const uuid = new ParseUUIDPipe({ version: '4' });

/**
 * Staff can draft, edit and publish. Only the specialist (ADMIN) can mark content
 * as clinically reviewed, delete it, or manage categories.
 */
@Controller('admin')
@Roles('ADMIN', 'STAFF')
export class AdminContentController {
  constructor(
    private readonly faqs: FaqService,
    private readonly articles: ArticleService,
    private readonly categories: CategoryService,
  ) {}

  // ----- FAQs -----
  @Get('faqs')
  listFaqs(@Query() q: AdminContentQuery) {
    return this.faqs.adminList(q);
  }

  @Get('faqs/:id')
  getFaq(@Param('id', uuid) id: string) {
    return this.faqs.adminGet(id);
  }

  @Post('faqs')
  createFaq(@Body() dto: CreateFaqDto) {
    return this.faqs.create(dto);
  }

  @Patch('faqs/:id')
  updateFaq(@Param('id', uuid) id: string, @Body() dto: UpdateFaqDto) {
    return this.faqs.update(id, dto);
  }

  @Post('faqs/:id/publish')
  @HttpCode(200)
  publishFaq(@Param('id', uuid) id: string) {
    return this.faqs.setStatus(id, 'PUBLISHED');
  }

  @Post('faqs/:id/unpublish')
  @HttpCode(200)
  unpublishFaq(@Param('id', uuid) id: string) {
    return this.faqs.setStatus(id, 'DRAFT');
  }

  @Post('faqs/:id/archive')
  @HttpCode(200)
  archiveFaq(@Param('id', uuid) id: string) {
    return this.faqs.setStatus(id, 'ARCHIVED');
  }

  @Post('faqs/:id/review')
  @HttpCode(200)
  @Roles('ADMIN')
  reviewFaq(@Param('id', uuid) id: string, @CurrentUser() user: SessionUser) {
    return this.faqs.markReviewed(id, user.id);
  }

  @Delete('faqs/:id')
  @HttpCode(204)
  @Roles('ADMIN')
  deleteFaq(@Param('id', uuid) id: string) {
    return this.faqs.remove(id);
  }

  // ----- Articles -----
  @Get('articles')
  listArticles(@Query() q: AdminContentQuery) {
    return this.articles.adminList(q);
  }

  @Get('articles/:id')
  getArticle(@Param('id', uuid) id: string) {
    return this.articles.adminGet(id);
  }

  @Post('articles')
  createArticle(@Body() dto: CreateArticleDto) {
    return this.articles.create(dto);
  }

  @Patch('articles/:id')
  updateArticle(@Param('id', uuid) id: string, @Body() dto: UpdateArticleDto) {
    return this.articles.update(id, dto);
  }

  @Post('articles/:id/publish')
  @HttpCode(200)
  publishArticle(@Param('id', uuid) id: string) {
    return this.articles.setStatus(id, 'PUBLISHED');
  }

  @Post('articles/:id/unpublish')
  @HttpCode(200)
  unpublishArticle(@Param('id', uuid) id: string) {
    return this.articles.setStatus(id, 'DRAFT');
  }

  @Post('articles/:id/review')
  @HttpCode(200)
  @Roles('ADMIN')
  reviewArticle(@Param('id', uuid) id: string, @CurrentUser() user: SessionUser) {
    return this.articles.markReviewed(id, user.id);
  }

  @Delete('articles/:id')
  @HttpCode(204)
  @Roles('ADMIN')
  deleteArticle(@Param('id', uuid) id: string) {
    return this.articles.remove(id);
  }

  // ----- Categories -----
  @Post('categories')
  @Roles('ADMIN')
  createCategory(@Body() dto: CategoryDto) {
    return this.categories.create(dto);
  }

  @Patch('categories/:id')
  @Roles('ADMIN')
  updateCategory(@Param('id', uuid) id: string, @Body() dto: UpdateCategoryDto) {
    return this.categories.update(id, dto);
  }
}
