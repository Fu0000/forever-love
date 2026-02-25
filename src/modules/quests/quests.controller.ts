import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { Response } from 'express';
import { CreateQuestDto } from './dto/create-quest.dto';
import { ListQuestsDto } from './dto/list-quests.dto';
import { UpdateQuestDto } from './dto/update-quest.dto';
import { QuestsService } from './quests.service';

@ApiTags('Quests')
@ApiBearerAuth()
@Controller()
export class QuestsController {
  constructor(private readonly questsService: QuestsService) {}

  @Get('couples/:coupleId/quests')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'sort', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'completed'] })
  list(
    @Param('coupleId') coupleId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListQuestsDto,
  ): Promise<{
    data: Array<{
      id: string;
      title: string;
      description: string | null;
      points: number;
      type: string;
      status: 'active' | 'completed';
      createdBy: string;
      createdAt: string;
      completedAt: string | null;
      completedBy: string | null;
    }>;
    __meta: Record<string, unknown>;
  }> {
    return this.questsService.list(coupleId, user.userId, query);
  }

  @Post('couples/:coupleId/quests')
  async create(
    @Param('coupleId') coupleId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateQuestDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{
    id: string;
    title: string;
    description: string | null;
    points: number;
    type: string;
    status: 'active' | 'completed';
    createdBy: string;
    createdAt: string;
    completedAt: string | null;
    completedBy: string | null;
  }> {
    const created = await this.questsService.create(coupleId, user.userId, dto);
    response.status(HttpStatus.CREATED);
    response.setHeader('Location', `/api/v1/quests/${created.id}`);
    return created;
  }

  @Patch('quests/:questId')
  update(
    @Param('questId') questId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateQuestDto,
  ): Promise<{
    id: string;
    title: string;
    description: string | null;
    points: number;
    type: string;
    status: 'active' | 'completed';
    createdBy: string;
    createdAt: string;
    completedAt: string | null;
    completedBy: string | null;
  }> {
    return this.questsService.update(questId, user.userId, dto);
  }

  @Post('quests/:questId/complete')
  complete(
    @Param('questId') questId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{
    id: string;
    title: string;
    description: string | null;
    points: number;
    type: string;
    status: 'active' | 'completed';
    createdBy: string;
    createdAt: string;
    completedAt: string | null;
    completedBy: string | null;
  }> {
    return this.questsService.complete(questId, user.userId);
  }

  @Delete('quests/:questId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('questId') questId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.questsService.remove(questId, user.userId);
  }
}
