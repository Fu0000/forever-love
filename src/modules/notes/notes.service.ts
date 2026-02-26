import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppException } from '../../common/errors/app.exception';
import { withMeta } from '../../common/utils/api-meta';
import { decodeCursor, encodeCursor } from '../../common/utils/cursor';
import { CouplesService } from '../couples/couples.service';
import { PrismaService } from '../prisma/prisma.service';
import { IntimacyService } from '../intimacy/intimacy.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { ListNotesDto } from './dto/list-notes.dto';
import { generateEntityId } from '../../common/utils/id';
import { UpdateNoteDto } from './dto/update-note.dto';
import { IntimacyEventType } from '@prisma/client';

@Injectable()
export class NotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couplesService: CouplesService,
    private readonly intimacyService: IntimacyService,
  ) {}

  async list(
    coupleId: string,
    userId: string,
    query: ListNotesDto,
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
    await this.couplesService.assertMember(coupleId, userId);

    const cursor = decodeCursor(query.cursor);
    if (query.cursor && !cursor) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'INVALID_CURSOR',
        'Cursor is invalid',
      );
    }

    const descending = query.sort !== 'createdAt';
    const cursorDate = cursor ? new Date(cursor.createdAt) : null;

    const where: Prisma.NoteWhereInput = {
      coupleId,
      authorId: query.authorId,
      ...(cursor && cursorDate
        ? {
            OR: descending
              ? [
                  { createdAt: { lt: cursorDate } },
                  { createdAt: cursorDate, id: { lt: cursor.id } },
                ]
              : [
                  { createdAt: { gt: cursorDate } },
                  { createdAt: cursorDate, id: { gt: cursor.id } },
                ],
          }
        : {}),
    };

    const rows = await this.prisma.note.findMany({
      where,
      orderBy: [
        { createdAt: descending ? 'desc' : 'asc' },
        { id: descending ? 'desc' : 'asc' },
      ],
      take: query.limit + 1,
    });

    const hasMore = rows.length > query.limit;
    const dataRows = hasMore ? rows.slice(0, query.limit) : rows;

    const nextCursor = hasMore
      ? encodeCursor({
          createdAt: dataRows[dataRows.length - 1].createdAt.toISOString(),
          id: dataRows[dataRows.length - 1].id,
        })
      : null;

    return withMeta(
      dataRows.map((item) => ({
        id: item.id,
        content: item.content,
        authorId: item.authorId,
        createdAt: item.createdAt.toISOString(),
        color: item.color,
        media: item.mediaUrl
          ? {
              url: item.mediaUrl,
              type: item.mediaType ?? 'image',
            }
          : null,
      })),
      { nextCursor },
    );
  }

  async create(
    coupleId: string,
    userId: string,
    dto: CreateNoteDto,
  ): Promise<{
    id: string;
    content: string;
    authorId: string;
    createdAt: string;
    color: string | null;
    media: { url: string; type: string } | null;
  }> {
    await this.couplesService.assertMember(coupleId, userId);

    const created = await this.prisma.$transaction(async (tx) => {
      const row = await tx.note.create({
        data: {
          id: generateEntityId('note_'),
          coupleId,
          authorId: userId,
          content: dto.content,
          color: dto.color,
          mediaUrl: dto.media?.url,
          mediaType: dto.media?.type,
        },
      });

      await this.intimacyService.award(
        coupleId,
        userId,
        IntimacyEventType.NOTE_CREATE,
        {
          dedupeKey: `note:${row.id}:create`,
          meta: { noteId: row.id, content: row.content },
          tx,
        },
      );

      return row;
    });

    return {
      id: created.id,
      content: created.content,
      authorId: created.authorId,
      createdAt: created.createdAt.toISOString(),
      color: created.color,
      media: created.mediaUrl
        ? {
            url: created.mediaUrl,
            type: created.mediaType ?? 'image',
          }
        : null,
    };
  }

  async remove(noteId: string, userId: string): Promise<void> {
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
      select: {
        id: true,
        coupleId: true,
      },
    });

    if (!note) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'NOT_FOUND',
        'Note not found',
      );
    }

    await this.couplesService.assertMember(note.coupleId, userId);

    await this.intimacyService.revokeCreateAward(
      note.coupleId,
      userId,
      `note:${note.id}:create`,
      `note:${note.id}:delete`,
      IntimacyEventType.NOTE_DELETE,
    );
    await this.prisma.note.delete({ where: { id: noteId } });
  }

  async update(
    noteId: string,
    actorUserId: string,
    dto: UpdateNoteDto,
  ): Promise<{
    id: string;
    content: string;
    authorId: string;
    createdAt: string;
    color: string | null;
    media: { url: string; type: string } | null;
  }> {
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
      select: {
        id: true,
        coupleId: true,
        authorId: true,
        createdAt: true,
      },
    });

    if (!note) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'NOT_FOUND',
        'Note not found',
      );
    }

    await this.couplesService.assertMember(note.coupleId, actorUserId);
    if (note.authorId !== actorUserId) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        'FORBIDDEN',
        'Only the author can edit this note',
      );
    }

    const updated = await this.prisma.note.update({
      where: { id: noteId },
      data: {
        content: dto.content,
        color: dto.color === null ? null : dto.color,
        mediaUrl:
          dto.media === null
            ? null
            : dto.media?.url
              ? dto.media.url
              : undefined,
        mediaType:
          dto.media === null
            ? null
            : dto.media?.type
              ? dto.media.type
              : undefined,
      },
    });

    return {
      id: updated.id,
      content: updated.content,
      authorId: updated.authorId,
      createdAt: updated.createdAt.toISOString(),
      color: updated.color,
      media: updated.mediaUrl
        ? {
            url: updated.mediaUrl,
            type: updated.mediaType ?? 'image',
          }
        : null,
    };
  }
}
