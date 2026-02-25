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
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateCupidConversationDto } from './dto/create-cupid-conversation.dto';
import { ListCupidConversationsDto } from './dto/list-cupid-conversations.dto';
import { UpdateCupidConversationDto } from './dto/update-cupid-conversation.dto';
import { CupidConversationsService } from './cupid-conversations.service';

@ApiTags('AI')
@ApiBearerAuth()
@Controller('ai/cupid/conversations')
export class CupidConversationsController {
  constructor(private readonly conversations: CupidConversationsService) {}

  @Get()
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListCupidConversationsDto,
  ): Promise<{ data: unknown; __meta: Record<string, unknown> }> {
    return this.conversations.list(user.userId, query);
  }

  @Get(':conversationId')
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
  ): Promise<unknown> {
    return this.conversations.get(user.userId, conversationId);
  }

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCupidConversationDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<unknown> {
    const created = await this.conversations.create(user.userId, dto);
    response.status(HttpStatus.CREATED);
    response.setHeader(
      'Location',
      `/api/v1/ai/cupid/conversations/${created.id}`,
    );
    return created;
  }

  @Patch(':conversationId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
    @Body() dto: UpdateCupidConversationDto,
  ): Promise<unknown> {
    return this.conversations.update(user.userId, conversationId, dto);
  }

  @Delete(':conversationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
  ): Promise<void> {
    return this.conversations.remove(user.userId, conversationId);
  }
}

