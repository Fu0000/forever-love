import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CouplesModule } from './modules/couples/couples.module';
import { NotesModule } from './modules/notes/notes.module';
import { QuestsModule } from './modules/quests/quests.module';
import { MomentsModule } from './modules/moments/moments.module';
import { MediaModule } from './modules/media/media.module';
import { PairRequestsModule } from './modules/pair-requests/pair-requests.module';
import { HealthController } from './health.controller';
import { NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CouplesModule,
    NotesModule,
    QuestsModule,
    MomentsModule,
    MediaModule,
    PairRequestsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes({
      path: '*path',
      method: RequestMethod.ALL,
    });
  }
}
