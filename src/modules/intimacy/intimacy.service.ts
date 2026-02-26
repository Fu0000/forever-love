import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, IntimacyEventType } from '@prisma/client';
import { randomInt } from 'crypto';
import { AppException } from '../../common/errors/app.exception';
import { withMeta } from '../../common/utils/api-meta';
import { decodeCursor, encodeCursor } from '../../common/utils/cursor';
import { generateEntityId } from '../../common/utils/id';
import { PrismaService } from '../prisma/prisma.service';
import { INTIMACY_RULES, computeLevelProgress, getIntimacyTitle } from './intimacy.rules';
import { ListIntimacyEventsDto } from './dto/list-intimacy-events.dto';

type TxClient = Prisma.TransactionClient;

const startOfTodayUtc = (): Date => {
  const now = new Date();
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  return start;
};

const clampDeltaToZeroFloor = (current: number, delta: number): number => {
  if (delta >= 0) return delta;
  if (current + delta >= 0) return delta;
  return -current;
};

@Injectable()
export class IntimacyService {
  constructor(private readonly prisma: PrismaService) {}

  async assertMember(coupleId: string, userId: string): Promise<void> {
    const couple = await this.prisma.couple.findUnique({
      where: { id: coupleId },
      select: { creatorId: true, partnerId: true },
    });
    if (!couple) {
      throw new AppException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Couple not found');
    }
    if (couple.creatorId !== userId && couple.partnerId !== userId) {
      throw new AppException(HttpStatus.FORBIDDEN, 'FORBIDDEN', 'User is not a member of this couple');
    }
  }

  private async ensureLegacyImport(coupleId: string, tx?: TxClient): Promise<void> {
    const db = tx ?? this.prisma;
    const existing = await db.intimacyEvent.findFirst({
      where: { coupleId },
      select: { id: true },
    });
    if (existing) return;

    const couple = await db.couple.findUnique({
      where: { id: coupleId },
      select: { intimacyScore: true, createdAt: true },
    });
    if (!couple) return;
    if (couple.intimacyScore <= 0) return;

    await db.intimacyEvent.create({
      data: {
        id: generateEntityId('itv_'),
        coupleId,
        userId: null,
        type: IntimacyEventType.LEGACY_IMPORT,
        points: couple.intimacyScore,
        dedupeKey: `legacy_import:${coupleId}`,
        meta: { importedAt: new Date().toISOString() } as Prisma.InputJsonValue,
        createdAt: couple.createdAt,
      },
      select: { id: true },
    });
  }

  private async sumTodayPositivePoints(
    coupleId: string,
    tx?: TxClient,
  ): Promise<number> {
    const db = tx ?? this.prisma;
    const start = startOfTodayUtc();
    const result = await db.intimacyEvent.aggregate({
      where: {
        coupleId,
        createdAt: { gte: start },
        points: { gt: 0 },
      },
      _sum: { points: true },
    });
    return result._sum.points ?? 0;
  }

  private async countTodayEvents(
    coupleId: string,
    type: IntimacyEventType,
    tx?: TxClient,
  ): Promise<number> {
    const db = tx ?? this.prisma;
    const start = startOfTodayUtc();
    return db.intimacyEvent.count({
      where: {
        coupleId,
        type,
        createdAt: { gte: start },
        points: { gt: 0 },
      },
    });
  }

  private async sumTodayByUser(
    coupleId: string,
    userId: string,
    type: IntimacyEventType,
    tx?: TxClient,
  ): Promise<number> {
    const db = tx ?? this.prisma;
    const start = startOfTodayUtc();
    const result = await db.intimacyEvent.aggregate({
      where: {
        coupleId,
        userId,
        type,
        createdAt: { gte: start },
        points: { gt: 0 },
      },
      _sum: { points: true },
    });
    return result._sum.points ?? 0;
  }

  private async hasRecentUserEvent(
    coupleId: string,
    userId: string,
    type: IntimacyEventType,
    withinSeconds: number,
    tx?: TxClient,
  ): Promise<boolean> {
    const db = tx ?? this.prisma;
    const since = new Date(Date.now() - withinSeconds * 1000);
    const found = await db.intimacyEvent.findFirst({
      where: {
        coupleId,
        userId,
        type,
        createdAt: { gte: since },
        points: { gt: 0 },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    return Boolean(found);
  }

  private computeNotePoints(content: string): number {
    const length = content.trim().length;
    const bonus =
      INTIMACY_RULES.note.lengthBonuses.find((row) => length >= row.minInclusive)
        ?.bonus ?? 0;
    return INTIMACY_RULES.note.base + bonus;
  }

  private computeMomentPoints(tags?: unknown): number {
    const hasTags = Array.isArray(tags) ? tags.length : 0;
    return INTIMACY_RULES.moment.base + (hasTags >= 2 ? INTIMACY_RULES.moment.tagsBonus : 0);
  }

  private computeSurprisePoints(type: string): number {
    if (type === 'gift') {
      return randomInt(1, 4); // 1-3
    }
    return randomInt(0, 3); // 0-2
  }

  private async applyCoupleDailyCap(
    coupleId: string,
    rawPoints: number,
    tx?: TxClient,
  ): Promise<number> {
    if (rawPoints <= 0) return rawPoints;
    const today = await this.sumTodayPositivePoints(coupleId, tx);
    const remaining = Math.max(0, INTIMACY_RULES.coupleDailyCap - today);
    return Math.min(rawPoints, remaining);
  }

  private async computeAwardPoints(
    coupleId: string,
    userId: string,
    type: IntimacyEventType,
    meta: Record<string, unknown>,
    tx?: TxClient,
  ): Promise<number> {
    const db = tx ?? this.prisma;

    if (type === IntimacyEventType.NOTE_CREATE) {
      const raw = this.computeNotePoints(String(meta.content ?? ''));
      const count = await this.countTodayEvents(coupleId, IntimacyEventType.NOTE_CREATE, tx);
      const idx = count + 1;
      const multiplier =
        idx <= INTIMACY_RULES.note.fullCount
          ? 1
          : idx <= INTIMACY_RULES.note.fullCount + INTIMACY_RULES.note.halfCount
            ? 0.5
            : 0;
      return Math.floor(raw * multiplier);
    }

    if (type === IntimacyEventType.MOMENT_CREATE) {
      const raw = this.computeMomentPoints(meta.tags);
      const count = await this.countTodayEvents(coupleId, IntimacyEventType.MOMENT_CREATE, tx);
      const idx = count + 1;
      const multiplier =
        idx <= INTIMACY_RULES.moment.fullCount
          ? 1
          : idx <= INTIMACY_RULES.moment.fullCount + INTIMACY_RULES.moment.halfCount
            ? 0.5
            : 0;
      return Math.floor(raw * multiplier);
    }

    if (type === IntimacyEventType.QUEST_CREATE) {
      const count = await this.countTodayEvents(coupleId, IntimacyEventType.QUEST_CREATE, tx);
      if (count >= INTIMACY_RULES.quest.createDailyFullCount) return 0;
      return INTIMACY_RULES.quest.createBase;
    }

    if (type === IntimacyEventType.QUEST_COMPLETE) {
      const questPoints = Number(meta.questPoints ?? 0);
      const capped = Math.min(Math.max(0, questPoints), INTIMACY_RULES.quest.completeMaxPoints);
      const crossBonus = meta.questCreatedBy && meta.questCreatedBy !== userId
        ? INTIMACY_RULES.quest.crossCompleteBonus
        : 0;
      const raw = capped + crossBonus;

      const start = startOfTodayUtc();
      const sum = await db.intimacyEvent.aggregate({
        where: {
          coupleId,
          type: IntimacyEventType.QUEST_COMPLETE,
          createdAt: { gte: start },
          points: { gt: 0 },
        },
        _sum: { points: true },
      });
      const today = sum._sum.points ?? 0;
      const remaining = Math.max(0, INTIMACY_RULES.quest.completeDailyCap - today);
      return Math.min(raw, remaining);
    }

    if (type === IntimacyEventType.PAIR_SUCCESS) {
      return INTIMACY_RULES.pairing.successPoints;
    }

    if (type === IntimacyEventType.ANNIVERSARY_SET) {
      return INTIMACY_RULES.anniversary.setPoints;
    }

    if (type === IntimacyEventType.SURPRISE_CLICK) {
      const cooled = await this.hasRecentUserEvent(
        coupleId,
        userId,
        IntimacyEventType.SURPRISE_CLICK,
        INTIMACY_RULES.surprise.cooldownSeconds,
        tx,
      );
      if (cooled) return 0;

      const raw = this.computeSurprisePoints(String(meta.type ?? ''));
      const today = await this.sumTodayByUser(
        coupleId,
        userId,
        IntimacyEventType.SURPRISE_CLICK,
        tx,
      );
      const remaining = Math.max(0, INTIMACY_RULES.surprise.userDailyCap - today);
      return Math.min(raw, remaining);
    }

    if (type === IntimacyEventType.ROMANTIC_ACTION) {
      const action = String(meta.action ?? '');
      const raw = action === 'scene_enter' ? INTIMACY_RULES.romantic.sceneEnterPoints : 0;
      const today = await this.sumTodayByUser(
        coupleId,
        userId,
        IntimacyEventType.ROMANTIC_ACTION,
        tx,
      );
      const remaining = Math.max(0, INTIMACY_RULES.romantic.userDailyCap - today);
      return Math.min(raw, remaining);
    }

    return 0;
  }

  async award(
    coupleId: string,
    userId: string,
    type: IntimacyEventType,
    input: {
      dedupeKey: string;
      meta?: Record<string, unknown>;
      tx?: TxClient;
    },
  ): Promise<{ awarded: number; score: number }> {
    const tx = input.tx;
    const db = tx ?? this.prisma;

    await this.ensureLegacyImport(coupleId, tx);

    const meta = input.meta ?? {};
    let raw = await this.computeAwardPoints(coupleId, userId, type, meta, tx);
    raw = await this.applyCoupleDailyCap(coupleId, raw, tx);

    if (raw <= 0) {
      const couple = await db.couple.findUnique({
        where: { id: coupleId },
        select: { intimacyScore: true },
      });
      return { awarded: 0, score: couple?.intimacyScore ?? 0 };
    }

    try {
      const updated = await db.couple.update({
        where: { id: coupleId },
        data: {
          intimacyScore: { increment: raw },
          intimacyEvents: {
            create: {
              id: generateEntityId('itv_'),
              userId,
              type,
              points: raw,
              dedupeKey: input.dedupeKey,
              meta: meta as Prisma.InputJsonValue,
            },
          },
        },
        select: { intimacyScore: true },
      });
      return { awarded: raw, score: updated.intimacyScore };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const couple = await db.couple.findUnique({
          where: { id: coupleId },
          select: { intimacyScore: true },
        });
        return { awarded: 0, score: couple?.intimacyScore ?? 0 };
      }
      throw error;
    }
  }

  async revokeCreateAward(
    coupleId: string,
    actorUserId: string,
    createDedupeKey: string,
    deleteDedupeKey: string,
    deleteType: IntimacyEventType,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.ensureLegacyImport(coupleId, tx);

      const existingDelete = await tx.intimacyEvent.findUnique({
        where: {
          coupleId_dedupeKey: {
            coupleId,
            dedupeKey: deleteDedupeKey,
          },
        },
        select: { id: true },
      });
      if (existingDelete) return;

      const createEvent = await tx.intimacyEvent.findUnique({
        where: {
          coupleId_dedupeKey: {
            coupleId,
            dedupeKey: createDedupeKey,
          },
        },
        select: { points: true },
      });
      if (!createEvent || createEvent.points <= 0) return;

      const couple = await tx.couple.findUnique({
        where: { id: coupleId },
        select: { intimacyScore: true },
      });
      if (!couple) return;

      const delta = clampDeltaToZeroFloor(couple.intimacyScore, -createEvent.points);
      if (delta === 0) return;

      await tx.couple.update({
        where: { id: coupleId },
        data: {
          intimacyScore: { increment: delta },
        },
        select: { id: true },
      });

      await tx.intimacyEvent.create({
        data: {
          id: generateEntityId('itv_'),
          coupleId,
          userId: actorUserId,
          type: deleteType,
          points: delta,
          dedupeKey: deleteDedupeKey,
          meta: { revoked: createDedupeKey } as Prisma.InputJsonValue,
        },
        select: { id: true },
      });
    });
  }

  async getSummary(
    coupleId: string,
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
    await this.ensureLegacyImport(coupleId);

    const couple = await this.prisma.couple.findUnique({
      where: { id: coupleId },
      select: { intimacyScore: true },
    });
    if (!couple) {
      throw new AppException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Couple not found');
    }

    const { level, levelStart, nextThreshold } = computeLevelProgress(couple.intimacyScore);
    const { title, hint } = getIntimacyTitle(level);
    const todayEarned = await this.sumTodayPositivePoints(coupleId);

    return {
      score: couple.intimacyScore,
      level,
      title,
      hint,
      levelStart,
      nextThreshold,
      todayEarned,
      todayCap: INTIMACY_RULES.coupleDailyCap,
    };
  }

  async listEvents(
    coupleId: string,
    actorUserId: string,
    query: ListIntimacyEventsDto,
  ): Promise<{
    data: Array<{
      id: string;
      userId: string | null;
      type: string;
      points: number;
      meta: Record<string, unknown> | null;
      createdAt: string;
    }>;
    __meta: Record<string, unknown>;
  }> {
    await this.ensureLegacyImport(coupleId);

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

    const where: Prisma.IntimacyEventWhereInput = {
      coupleId,
      userId: query.userId ?? undefined,
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

    const rows = await this.prisma.intimacyEvent.findMany({
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
      dataRows.map((row) => ({
        id: row.id,
        userId: row.userId ?? null,
        type: row.type,
        points: row.points,
        meta: (row.meta as Record<string, unknown> | null) ?? null,
        createdAt: row.createdAt.toISOString(),
      })),
      { nextCursor },
    );
  }
}
