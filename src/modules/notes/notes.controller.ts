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
import { CreateNoteDto } from './dto/create-note.dto';
import { ListNotesDto } from './dto/list-notes.dto';
import { NotesService } from './notes.service';

@ApiTags('Notes')
@ApiBearerAuth()
@Controller()
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get('couples/:coupleId/notes')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'sort', required: false, type: String })
  @ApiQuery({ name: 'authorId', required: false, type: String })
  list(
    @Param('coupleId') coupleId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListNotesDto,
  ): Promise<{
    data: Array<{
      id: string;
      content: string;
      authorId: string;
      createdAt: string;
      color: string | null;
      media: { url: string; type: string } | null;
    }>;
    __meta: Record<string, unknown>;
  }> {
    return this.notesService.list(coupleId, user.userId, query);
  }

  @Post('couples/:coupleId/notes')
  async create(
    @Param('coupleId') coupleId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateNoteDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{
    id: string;
    content: string;
    authorId: string;
    createdAt: string;
    color: string | null;
    media: { url: string; type: string } | null;
  }> {
    const note = await this.notesService.create(coupleId, user.userId, dto);
    response.status(HttpStatus.CREATED);
    response.setHeader('Location', `/api/v1/notes/${note.id}`);
    return note;
  }

  @Delete('notes/:noteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('noteId') noteId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.notesService.remove(noteId, user.userId);
  }
}
