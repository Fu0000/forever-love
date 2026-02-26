import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { IntimacyController } from './intimacy.controller';
import { IntimacyService } from './intimacy.service';

@Module({
  imports: [PrismaModule],
  controllers: [IntimacyController],
  providers: [IntimacyService],
  exports: [IntimacyService],
})
export class IntimacyModule {}

