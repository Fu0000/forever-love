import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { Response } from 'express';
import { CreateMomentDto } from './dto/create-moment.dto';
import { ListMomentsDto } from './dto/list-moments.dto';
import { MomentsService } from './moments.service';

@ApiTags('Moments')
@ApiBearerAuth()
@Controller()
export class MomentsController {
  constructor(private readonly momentsService: MomentsService) {}

  @Get('couples/:coupleId/moments')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'sort', required: false, type: String })
  @ApiQuery({ name: 'tag', required: false, type: String })
  list(
    @Param('coupleId') coupleId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListMomentsDto,
  ): Promise<{
    data: Array<{
      id: string;
      title: string;
      description: string | null;
      date: string;
      imageUrl: string;
      tags: string[];
      createdAt: string;
    }>;
    __meta: Record<string, unknown>;
  }> {
    return this.momentsService.list(coupleId, user.userId, query);
  }

  @Post('couples/:coupleId/moments')
  async create(
    @Param('coupleId') coupleId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMomentDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{
    id: string;
    title: string;
    description: string | null;
    date: string;
    imageUrl: string;
    tags: string[];
    createdAt: string;
  }> {
    const created = await this.momentsService.create(
      coupleId,
      user.userId,
      dto,
    );
    response.status(HttpStatus.CREATED);
    response.setHeader('Location', `/api/v1/moments/${created.id}`);
    return created;
  }

  @Delete('moments/:momentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('momentId') momentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.momentsService.remove(momentId, user.userId);
  }
}
