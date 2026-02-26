import { Module } from '@nestjs/common';
import { CouplesModule } from '../couples/couples.module';
import { IntimacyModule } from '../intimacy/intimacy.module';
import { PairRequestsController } from './pair-requests.controller';
import { PairRequestsService } from './pair-requests.service';

@Module({
  imports: [CouplesModule, IntimacyModule],
  controllers: [PairRequestsController],
  providers: [PairRequestsService],
})
export class PairRequestsModule {}
