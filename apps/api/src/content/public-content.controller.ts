import { Controller, Get, Param, Query } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { CurrentUser, type SessionUser } from '../auth/decorators';
import { ContentListQuery } from '../common/util';
import { audienceEnum, type Audience } from '../db/schema';
import { ArticleService } from './article.service';
import { CategoryService } from './category.service';
import { FaqService } from './faq.service';

class AudienceQuery {
  @IsOptional() @IsIn(audienceEnum.enumValues)
  audience?: Audience;
}

class SearchQuery extends AudienceQuery {
  @IsString() @MaxLength(200)
  q: string;
}

@Controller()
export class PublicContentController {
  constructor(
    private readonly faqs: FaqService,
    private readonly articles: ArticleService,
    private readonly categories: CategoryService,
  ) {}

  @Get('categories')
  listCategories(@Query() query: AudienceQuery) {
    return this.categories.list(query.audience);
  }

  @Get('faqs')
  listFaqs(@Query() query: ContentListQuery) {
    return this.faqs.listPublished(query);
  }

  @Get('faqs/:slug')
  getFaq(@Param('slug') slug: string) {
    return this.faqs.getPublished(slug);
  }

  @Get('articles')
  listArticles(@Query() query: ContentListQuery) {
    return this.articles.listPublished(query);
  }

  @Get('articles/:slug')
  getArticle(@Param('slug') slug: string, @CurrentUser() user?: SessionUser) {
    return this.articles.getPublished(slug, user);
  }

  /** One search box across FAQs and articles. */
  @Get('search')
  async search(@Query() query: SearchQuery) {
    const base = { q: query.q, audience: query.audience, page: 1 };
    const [faqs, articles] = await Promise.all([
      this.faqs.listPublished({ ...base, pageSize: 10 }),
      this.articles.listPublished({ ...base, pageSize: 5 }),
    ]);
    return { q: query.q, faqs: faqs.items, articles: articles.items };
  }

  /** Published slugs for the web app's sitemap.xml */
  @Get('sitemap')
  async sitemap() {
    const [faqs, articles] = await Promise.all([this.faqs.sitemap(), this.articles.sitemap()]);
    return { faqs, articles };
  }
}
