import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppException } from '../../common/errors/app.exception';
import { withMeta } from '../../common/utils/api-meta';
import { decodeCursor, encodeCursor } from '../../common/utils/cursor';
import { toDateOnlyString } from '../../common/utils/date';
import { generateEntityId } from '../../common/utils/id';
import { CouplesService } from '../couples/couples.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMomentDto } from './dto/create-moment.dto';
import { ListMomentsDto } from './dto/list-moments.dto';

@Injectable()
export class MomentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couplesService: CouplesService,
  ) {}

  private mapMoment(moment: {
    id: string;
    title: string;
    description: string | null;
    date: Date;
    imageUrl: string;
    tags: string[];
    createdAt: Date;
  }): {
    id: string;
    title: string;
    description: string | null;
    date: string;
    imageUrl: string;
    tags: string[];
    createdAt: string;
  } {
    return {
      id: moment.id,
      title: moment.title,
      description: moment.description,
      date: toDateOnlyString(moment.date) ?? '',
      imageUrl: moment.imageUrl,
      tags: moment.tags,
      createdAt: moment.createdAt.toISOString(),
    };
  }

  async list(
    coupleId: string,
    userId: string,
    query: ListMomentsDto,
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

    const where: Prisma.MomentWhereInput = {
      coupleId,
      tags: query.tag ? { has: query.tag } : undefined,
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

    const rows = await this.prisma.moment.findMany({
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
      dataRows.map((item) => this.mapMoment(item)),
      { nextCursor },
    );
  }

  async create(
    coupleId: string,
    userId: string,
    dto: CreateMomentDto,
  ): Promise<{
    id: string;
    title: string;
    description: string | null;
    date: string;
    imageUrl: string;
    tags: string[];
    createdAt: string;
  }> {
    await this.couplesService.assertMember(coupleId, userId);

    const created = await this.prisma.moment.create({
      data: {
        id: generateEntityId('mmt_'),
        coupleId,
        title: dto.title,
        description: dto.description,
        date: new Date(dto.date),
        imageUrl: dto.imageUrl,
        tags: dto.tags ?? [],
      },
    });

    return this.mapMoment(created);
  }

  async remove(momentId: string, actorUserId: string): Promise<void> {
    const moment = await this.prisma.moment.findUnique({
      where: { id: momentId },
      select: {
        id: true,
        coupleId: true,
      },
    });

    if (!moment) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'NOT_FOUND',
        'Moment not found',
      );
    }

    await this.couplesService.assertMember(moment.coupleId, actorUserId);
    await this.prisma.moment.delete({ where: { id: momentId } });
  }
}
