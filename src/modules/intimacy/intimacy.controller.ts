import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { IntimacyEventType } from '@prisma/client';
import { IntimacyService } from './intimacy.service';
import { ListIntimacyEventsDto } from './dto/list-intimacy-events.dto';
import { SurpriseClickDto } from './dto/surprise-click.dto';
import { RomanticActionDto } from './dto/romantic-action.dto';

@ApiTags('Intimacy')
@ApiBearerAuth()
@Controller('couples/:coupleId/intimacy')
export class IntimacyController {
  constructor(private readonly intimacyService: IntimacyService) {}

  @Get()
  async getSummary(
    @Param('coupleId') coupleId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{
    score: number;
    level: number;
    title: string;
    hint: string;
    levelStart: number;
    nextThreshold: number;
    todayEarned: number;
    todayCap: number;
  }> {
    await this.intimacyService.assertMember(coupleId, user.userId);
    return this.intimacyService.getSummary(coupleId);
  }

  @Get('events')
  async listEvents(
    @Param('coupleId') coupleId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListIntimacyEventsDto,
  ): Promise<{ data: unknown; __meta: Record<string, unknown> }> {
    await this.intimacyService.assertMember(coupleId, user.userId);
    return this.intimacyService.listEvents(coupleId, user.userId, query);
  }

  @Post('surprise/click')
  async surpriseClick(
    @Param('coupleId') coupleId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SurpriseClickDto,
  ): Promise<{ points: number; score: number }> {
    await this.intimacyService.assertMember(coupleId, user.userId);

    const result = await this.intimacyService.award(
      coupleId,
      user.userId,
      IntimacyEventType.SURPRISE_CLICK,
      {
        dedupeKey: `surprise:${user.userId}:${dto.clientEventId}`,
        meta: {
          type: dto.type,
          clientEventId: dto.clientEventId,
        },
      },
    );

    return { points: result.awarded, score: result.score };
  }

  @Post('romantic/action')
  async romanticAction(
    @Param('coupleId') coupleId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RomanticActionDto,
  ): Promise<{ points: number; score: number }> {
    await this.intimacyService.assertMember(coupleId, user.userId);

    const result = await this.intimacyService.award(
      coupleId,
      user.userId,
      IntimacyEventType.ROMANTIC_ACTION,
      {
        dedupeKey: `romantic:${user.userId}:${dto.clientEventId}`,
        meta: {
          action: dto.action,
          sceneId: dto.sceneId,
          clientEventId: dto.clientEventId,
        },
      },
    );

    return { points: result.awarded, score: result.score };
  }
}

