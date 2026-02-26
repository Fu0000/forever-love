import { HttpStatus, Injectable } from '@nestjs/common';
import { IntimacyEventType, Prisma, QuestStatus } from '@prisma/client';
import { AppException } from '../../common/errors/app.exception';
import { withMeta } from '../../common/utils/api-meta';
import { decodeCursor, encodeCursor } from '../../common/utils/cursor';
import { generateEntityId } from '../../common/utils/id';
import { CouplesService } from '../couples/couples.service';
import { IntimacyService } from '../intimacy/intimacy.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestDto } from './dto/create-quest.dto';
import { ListQuestsDto } from './dto/list-quests.dto';
import { UpdateQuestDto } from './dto/update-quest.dto';

const toQuestStatus = (status: QuestStatus): 'active' | 'completed' =>
  status === QuestStatus.ACTIVE ? 'active' : 'completed';

@Injectable()
export class QuestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couplesService: CouplesService,
    private readonly intimacyService: IntimacyService,
  ) {}

  private mapQuest(quest: {
    id: string;
    title: string;
    description: string | null;
    points: number;
    type: string;
    status: QuestStatus;
    createdBy: string;
    createdAt: Date;
    completedAt: Date | null;
    completedBy: string | null;
  }): {
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
  } {
    return {
      id: quest.id,
      title: quest.title,
      description: quest.description,
      points: quest.points,
      type: quest.type,
      status: toQuestStatus(quest.status),
      createdBy: quest.createdBy,
      createdAt: quest.createdAt.toISOString(),
      completedAt: quest.completedAt?.toISOString() ?? null,
      completedBy: quest.completedBy,
    };
  }

  async list(
    coupleId: string,
    userId: string,
    query: ListQuestsDto,
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
    await this.couplesService.assertMember(coupleId, userId);

    const cursor = decodeCursor(query.cursor);
    if (query.cursor && !cursor) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'INVALID_CURSOR',
        'Cursor is invalid',
      );
    }

    const status =
      query.status === 'active'
        ? QuestStatus.ACTIVE
        : query.status === 'completed'
          ? QuestStatus.COMPLETED
          : undefined;

    const descending = query.sort !== 'createdAt';
    const cursorDate = cursor ? new Date(cursor.createdAt) : null;

    const where: Prisma.QuestWhereInput = {
      coupleId,
      status,
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

    const rows = await this.prisma.quest.findMany({
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
      dataRows.map((item) => this.mapQuest(item)),
      { nextCursor },
    );
  }

  async create(
    coupleId: string,
    userId: string,
    dto: CreateQuestDto,
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
    await this.couplesService.assertMember(coupleId, userId);

    const created = await this.prisma.$transaction(async (tx) => {
      const row = await tx.quest.create({
        data: {
          id: generateEntityId('qst_'),
          coupleId,
          title: dto.title,
          description: dto.description,
          points: dto.points,
          type: dto.type,
          status: QuestStatus.ACTIVE,
          createdBy: userId,
        },
      });

      await this.intimacyService.award(
        coupleId,
        userId,
        IntimacyEventType.QUEST_CREATE,
        {
          dedupeKey: `quest:${row.id}:create`,
          meta: { questId: row.id },
          tx,
        },
      );

      return row;
    });

    return this.mapQuest(created);
  }

  async update(
    questId: string,
    actorUserId: string,
    dto: UpdateQuestDto,
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
    const quest = await this.prisma.quest.findUnique({
      where: { id: questId },
      select: {
        id: true,
        coupleId: true,
      },
    });

    if (!quest) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'NOT_FOUND',
        'Quest not found',
      );
    }

    await this.couplesService.assertMember(quest.coupleId, actorUserId);

    const updated = await this.prisma.quest.update({
      where: { id: questId },
      data: {
        title: dto.title,
        description: dto.description,
        points: dto.points,
        type: dto.type,
      },
    });

    return this.mapQuest(updated);
  }

  async complete(
    questId: string,
    actorUserId: string,
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
    const quest = await this.prisma.quest.findUnique({
      where: { id: questId },
    });

    if (!quest) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'NOT_FOUND',
        'Quest not found',
      );
    }

    await this.couplesService.assertMember(quest.coupleId, actorUserId);

    if (quest.status === QuestStatus.COMPLETED) {
      return this.mapQuest(quest);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const updateResult = await tx.quest.updateMany({
        where: { id: questId, status: QuestStatus.ACTIVE },
        data: {
          status: QuestStatus.COMPLETED,
          completedAt: now,
          completedBy: actorUserId,
        },
      });

      const row = await tx.quest.findUnique({ where: { id: questId } });
      if (!row) {
        throw new AppException(
          HttpStatus.NOT_FOUND,
          'NOT_FOUND',
          'Quest not found',
        );
      }

      if (updateResult.count > 0) {
        await this.intimacyService.award(
          row.coupleId,
          actorUserId,
          IntimacyEventType.QUEST_COMPLETE,
          {
            dedupeKey: `quest:${row.id}:complete`,
            meta: {
              questId: row.id,
              questPoints: row.points,
              questCreatedBy: row.createdBy,
            },
            tx,
          },
        );
      }

      return row;
    });

    return this.mapQuest(updated);
  }

  async remove(questId: string, actorUserId: string): Promise<void> {
    const quest = await this.prisma.quest.findUnique({
      where: { id: questId },
      select: {
        id: true,
        coupleId: true,
      },
    });

    if (!quest) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'NOT_FOUND',
        'Quest not found',
      );
    }

    await this.couplesService.assertMember(quest.coupleId, actorUserId);

    await this.intimacyService.revokeCreateAward(
      quest.coupleId,
      actorUserId,
      `quest:${quest.id}:create`,
      `quest:${quest.id}:delete`,
      IntimacyEventType.QUEST_DELETE,
    );
    await this.prisma.quest.delete({ where: { id: questId } });
  }
}
