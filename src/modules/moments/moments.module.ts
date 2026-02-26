import { Module } from '@nestjs/common';
import { CouplesModule } from '../couples/couples.module';
import { IntimacyModule } from '../intimacy/intimacy.module';
import { MomentsController } from './moments.controller';
import { MomentsService } from './moments.service';

@Module({
  imports: [CouplesModule, IntimacyModule],
  controllers: [MomentsController],
  providers: [MomentsService],
})
export class MomentsModule {}
