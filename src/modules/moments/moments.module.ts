import { Module } from '@nestjs/common';
import { CouplesModule } from '../couples/couples.module';
import { MomentsController } from './moments.controller';
import { MomentsService } from './moments.service';

@Module({
  imports: [CouplesModule],
  controllers: [MomentsController],
  providers: [MomentsService],
})
export class MomentsModule {}
