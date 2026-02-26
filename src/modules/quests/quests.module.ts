import { Module } from '@nestjs/common';
import { CouplesModule } from '../couples/couples.module';
import { IntimacyModule } from '../intimacy/intimacy.module';
import { QuestsController } from './quests.controller';
import { QuestsService } from './quests.service';

@Module({
  imports: [CouplesModule, IntimacyModule],
  controllers: [QuestsController],
  providers: [QuestsService],
})
export class QuestsModule {}
