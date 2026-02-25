import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app.exception';
import { withMeta } from '../../common/utils/api-meta';
import { decodeCursor, encodeCursor } from '../../common/utils/cursor';
import { generateEntityId } from '../../common/utils/id';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCupidConversationDto } from './dto/create-cupid-conversation.dto';
import { ListCupidConversationsDto } from './dto/list-cupid-conversations.dto';
import { UpdateCupidConversationDto } from './dto/update-cupid-conversation.dto';

type ConversationListItem = {
  id: string;
  title: string;
  messageCount: number;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ConversationDetail = {
  id: string;
  title: string;
  messages: Array<{
    role: 'user' | 'model';
    text: string;
    timestampMs: number | null;
  }>;
};

const defaultTitle = (now: Date): string => {
  const iso = now.toISOString();
  return `丘比特对话 ${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
};

const toMillisNumber = (value: bigint | null): number | null => {
  if (value === null) return null;
  const asNumber = Number(value);
  return Number.isFinite(asNumber) ? asNumber : null;
};

@Injectable()
export class CupidConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, query: ListCupidConversationsDto): Promise<{
    data: ConversationListItem[];
    __meta: Record<string, unknown>;
  }> {
    const cursor = decodeCursor(query.cursor);
    if (query.cursor && !cursor) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'INVALID_CURSOR',
        'Cursor is invalid',
      );
    }

    const cursorDate = cursor ? new Date(cursor.createdAt) : null;

    const rows = await this.prisma.cupidConversation.findMany({
      where: {
        userId,
        ...(cursor && cursorDate
          ? {
              OR: [
                { updatedAt: { lt: cursorDate } },
                { updatedAt: cursorDate, id: { lt: cursor.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
    });

    const hasMore = rows.length > query.limit;
    const dataRows = hasMore ? rows.slice(0, query.limit) : rows;

    const nextCursor = hasMore
      ? encodeCursor({
          createdAt: dataRows[dataRows.length - 1].updatedAt.toISOString(),
          id: dataRows[dataRows.length - 1].id,
        })
      : null;

    return withMeta(
      dataRows.map((row) => ({
        id: row.id,
        title: row.title,
        messageCount: row.messageCount,
        lastMessageAt: row.lastMessageAt ? row.lastMessageAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
      { nextCursor },
    );
  }

  async get(userId: string, conversationId: string): Promise<ConversationDetail> {
    const conversation = await this.prisma.cupidConversation.findUnique({
      where: { id: conversationId },
      select: { id: true, userId: true, title: true },
    });

    if (!conversation || conversation.userId !== userId) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'CONVERSATION_NOT_FOUND',
        'Conversation not found',
      );
    }

    const messages = await this.prisma.cupidMessage.findMany({
      where: { conversationId },
      orderBy: { seq: 'asc' },
      select: { role: true, text: true, timestampMs: true },
    });

    return {
      id: conversation.id,
      title: conversation.title,
      messages: messages.map((msg) => ({
        role: msg.role as 'user' | 'model',
        text: msg.text,
        timestampMs: toMillisNumber(msg.timestampMs),
      })),
    };
  }

  async create(
    userId: string,
    dto: CreateCupidConversationDto,
  ): Promise<ConversationListItem> {
    const now = new Date();
    const id = generateEntityId('cvc_');
    const title = dto.title?.trim() || defaultTitle(now);

    const lastTimestampMs =
      dto.messages.length > 0
        ? dto.messages[dto.messages.length - 1].timestampMs ?? null
        : null;
    const lastMessageAt =
      typeof lastTimestampMs === 'number' ? new Date(lastTimestampMs) : null;

    const created = await this.prisma.$transaction(async (tx) => {
      const conversation = await tx.cupidConversation.create({
        data: {
          id,
          userId,
          title,
          messageCount: dto.messages.length,
          lastMessageAt,
        },
      });

      if (dto.messages.length > 0) {
        await tx.cupidMessage.createMany({
          data: dto.messages.map((msg, index) => ({
            id: generateEntityId('cmsg_'),
            conversationId: conversation.id,
            seq: index + 1,
            role: msg.role,
            text: msg.text,
            timestampMs:
              typeof msg.timestampMs === 'number'
                ? BigInt(msg.timestampMs)
                : null,
          })),
        });
      }

      return conversation;
    });

    return {
      id: created.id,
      title: created.title,
      messageCount: created.messageCount,
      lastMessageAt: created.lastMessageAt ? created.lastMessageAt.toISOString() : null,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async update(
    userId: string,
    conversationId: string,
    dto: UpdateCupidConversationDto,
  ): Promise<ConversationListItem> {
    const existing = await this.prisma.cupidConversation.findUnique({
      where: { id: conversationId },
      select: { id: true, userId: true },
    });

    if (!existing || existing.userId !== userId) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'CONVERSATION_NOT_FOUND',
        'Conversation not found',
      );
    }

    if (dto.messages && dto.messages.length === 0) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'BAD_REQUEST',
        'messages cannot be empty',
      );
    }

    const lastTimestampMs =
      dto.messages && dto.messages.length > 0
        ? dto.messages[dto.messages.length - 1].timestampMs ?? null
        : null;
    const lastMessageAt =
      typeof lastTimestampMs === 'number' ? new Date(lastTimestampMs) : undefined;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.messages) {
        await tx.cupidMessage.deleteMany({ where: { conversationId } });
        await tx.cupidMessage.createMany({
          data: dto.messages.map((msg, index) => ({
            id: generateEntityId('cmsg_'),
            conversationId,
            seq: index + 1,
            role: msg.role,
            text: msg.text,
            timestampMs:
              typeof msg.timestampMs === 'number'
                ? BigInt(msg.timestampMs)
                : null,
          })),
        });
      }

      return tx.cupidConversation.update({
        where: { id: conversationId },
        data: {
          title: dto.title?.trim() || undefined,
          messageCount: dto.messages ? dto.messages.length : undefined,
          lastMessageAt,
        },
      });
    });

    return {
      id: updated.id,
      title: updated.title,
      messageCount: updated.messageCount,
      lastMessageAt: updated.lastMessageAt ? updated.lastMessageAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async remove(userId: string, conversationId: string): Promise<void> {
    const existing = await this.prisma.cupidConversation.findUnique({
      where: { id: conversationId },
      select: { id: true, userId: true },
    });

    if (!existing || existing.userId !== userId) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'CONVERSATION_NOT_FOUND',
        'Conversation not found',
      );
    }

    await this.prisma.cupidConversation.delete({ where: { id: conversationId } });
  }
}

