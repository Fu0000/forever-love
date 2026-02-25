import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { CupidConversationsController } from './cupid-conversations.controller';
import { CupidConversationsService } from './cupid-conversations.service';

@Module({
  controllers: [AiController, CupidConversationsController],
  providers: [AiService, CupidConversationsService],
})
export class AiModule {}
