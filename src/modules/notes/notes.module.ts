import { Module } from '@nestjs/common';
import { CouplesModule } from '../couples/couples.module';
import { IntimacyModule } from '../intimacy/intimacy.module';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

@Module({
  imports: [CouplesModule, IntimacyModule],
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
