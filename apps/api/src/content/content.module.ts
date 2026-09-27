import { Module } from '@nestjs/common';
import { AdminContentController } from './admin-content.controller';
import { ArticleService } from './article.service';
import { CategoryService } from './category.service';
import { FaqService } from './faq.service';
import { PublicContentController } from './public-content.controller';
import { SlugService } from './slug.service';

@Module({
  controllers: [PublicContentController, AdminContentController],
  providers: [FaqService, ArticleService, CategoryService, SlugService],
  exports: [FaqService],
})
export class ContentModule {}
