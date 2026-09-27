import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../auth/decorators';
import { PageQuery } from '../common/util';
import {
  AskQuestionDto,
  ClinicEnquiryDto,
  DraftFaqFromQuestionDto,
  EnquiryFilter,
  QuestionFilter,
  UpdateEnquiryDto,
  UpdateQuestionDto,
} from './inbox.dto';
import { InboxService } from './inbox.service';

const FORM_LIMIT = { default: { limit: 5, ttl: 60_000 } };
const uuid = new ParseUUIDPipe({ version: '4' });

@Controller()
export class PublicInboxController {
  constructor(private readonly inbox: InboxService) {}

  @Post('questions')
  @HttpCode(202)
  @Throttle(FORM_LIMIT)
  async ask(@Body() dto: AskQuestionDto) {
    await this.inbox.ask(dto);
    return { received: true };
  }

  @Post('enquiries')
  @HttpCode(202)
  @Throttle(FORM_LIMIT)
  async enquire(@Body() dto: ClinicEnquiryDto) {
    await this.inbox.enquire(dto);
    return { received: true };
  }
}

@Controller('admin')
@Roles('ADMIN', 'STAFF')
export class AdminInboxController {
  constructor(private readonly inbox: InboxService) {}

  @Get('stats')
  stats() {
    return this.inbox.stats();
  }

  @Get('questions')
  listQuestions(@Query() filter: QuestionFilter) {
    return this.inbox.listQuestions(filter);
  }

  @Patch('questions/:id')
  updateQuestion(@Param('id', uuid) id: string, @Body() dto: UpdateQuestionDto) {
    return this.inbox.updateQuestion(id, dto);
  }

  @Post('questions/:id/draft-faq')
  draftFaq(@Param('id', uuid) id: string, @Body() dto: DraftFaqFromQuestionDto) {
    return this.inbox.draftFaq(id, dto);
  }

  @Get('enquiries')
  listEnquiries(@Query() filter: EnquiryFilter) {
    return this.inbox.listEnquiries(filter);
  }

  @Patch('enquiries/:id')
  updateEnquiry(@Param('id', uuid) id: string, @Body() dto: UpdateEnquiryDto) {
    return this.inbox.updateEnquiry(id, dto);
  }

  /** Registered dentists and students; contains personal data, so specialist only. */
  @Get('members')
  @Roles('ADMIN')
  members(@Query() page: PageQuery) {
    return this.inbox.listMembers(page);
  }
}
