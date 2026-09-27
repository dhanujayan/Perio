import { Module } from '@nestjs/common';
import { ContentModule } from '../content/content.module';
import { AdminInboxController, PublicInboxController } from './inbox.controller';
import { InboxService } from './inbox.service';

@Module({
  imports: [ContentModule],
  controllers: [PublicInboxController, AdminInboxController],
  providers: [InboxService],
})
export class InboxModule {}
