import { Module } from '@nestjs/common';
import { CouplesModule } from '../couples/couples.module';
import { PairRequestsController } from './pair-requests.controller';
import { PairRequestsService } from './pair-requests.service';

@Module({
  imports: [CouplesModule],
  controllers: [PairRequestsController],
  providers: [PairRequestsService],
})
export class PairRequestsModule {}

