import { Module } from '@nestjs/common';
import { CouplesModule } from '../couples/couples.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [CouplesModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
