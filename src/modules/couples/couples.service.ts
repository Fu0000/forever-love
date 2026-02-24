import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../../common/errors/app.exception';
import { generateEntityId, generatePairCode } from '../../common/utils/id';
import { Prisma } from '@prisma/client';
import { UpdateCoupleDto } from './dto/update-couple.dto';
import { toDateOnlyString } from '../../common/utils/date';

type CoupleWithUsers = Prisma.CoupleGetPayload<{
  include: {
    creator: true;
    partner: true;
  };
}>;

@Injectable()
export class CouplesService {
  constructor(private readonly prisma: PrismaService) {}

  private mapCouple(couple: CoupleWithUsers): {
    id: string;
    pairCode: string;
    creatorId: string;
    partnerId: string | null;
    anniversaryDate: string | null;
    intimacyScore: number;
    users: Array<{ id: string; name: string; avatarUrl: string | null }>;
  } {
    const users = [couple.creator, couple.partner]
      .filter((user) => Boolean(user))
      .map((user) => ({
        id: user!.id,
        name: user!.name,
        avatarUrl: user!.avatarUrl,
      }));

    return {
      id: couple.id,
      pairCode: couple.pairCode,
      creatorId: couple.creatorId,
      partnerId: couple.partnerId,
      anniversaryDate: toDateOnlyString(couple.anniversaryDate),
      intimacyScore: couple.intimacyScore,
      users,
    };
  }

  async assertMember(coupleId: string, userId: string): Promise<void> {
    const couple = await this.prisma.couple.findUnique({
      where: {
        id: coupleId,
      },
      select: {
        creatorId: true,
        partnerId: true,
      },
    });

    if (!couple) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'NOT_FOUND',
        'Couple not found',
      );
    }

    if (couple.creatorId !== userId && couple.partnerId !== userId) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        'FORBIDDEN',
        'User is not a member of this couple',
      );
    }
  }

  async create(userId: string): Promise<{
    id: string;
    pairCode: string;
    creatorId: string;
    partnerId: string | null;
    anniversaryDate: string | null;
    intimacyScore: number;
    users: Array<{ id: string; name: string; avatarUrl: string | null }>;
  }> {
    const existing = await this.prisma.couple.findFirst({
      where: {
        OR: [{ creatorId: userId }, { partnerId: userId }],
      },
      select: { id: true },
    });
    if (existing) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'ALREADY_JOINED',
        'User already belongs to a couple',
      );
    }

    for (let index = 0; index < 8; index += 1) {
      try {
        const couple = await this.prisma.couple.create({
          data: {
            id: generateEntityId('cpl_'),
            pairCode: generatePairCode(),
            creatorId: userId,
          },
          include: {
            creator: true,
            partner: true,
          },
        });
        return this.mapCouple(couple);
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          continue;
        }
        throw error;
      }
    }

    throw new AppException(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'PAIR_CODE_GENERATION_FAILED',
      'Failed to allocate pair code',
    );
  }

  async join(
    userId: string,
    pairCodeInput: string,
  ): Promise<{
    id: string;
    pairCode: string;
    creatorId: string;
    partnerId: string | null;
    anniversaryDate: string | null;
    intimacyScore: number;
    users: Array<{ id: string; name: string; avatarUrl: string | null }>;
  }> {
    const pairCode = pairCodeInput.toUpperCase();

    const coupleByCode = await this.prisma.couple.findUnique({
      where: { pairCode },
      select: { id: true, creatorId: true, partnerId: true },
    });

    if (!coupleByCode) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'PAIR_CODE_NOT_FOUND',
        'Pair code not found',
      );
    }

    if (
      coupleByCode.creatorId === userId ||
      coupleByCode.partnerId === userId
    ) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'ALREADY_JOINED',
        'User already joined this couple',
      );
    }

    const anotherCouple = await this.prisma.couple.findFirst({
      where: {
        OR: [{ creatorId: userId }, { partnerId: userId }],
      },
      select: { id: true },
    });

    if (anotherCouple) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'ALREADY_JOINED',
        'User already belongs to another couple',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      const updateResult = await tx.couple.updateMany({
        where: {
          id: coupleByCode.id,
          partnerId: null,
        },
        data: {
          partnerId: userId,
        },
      });

      if (updateResult.count === 0) {
        throw new AppException(
          HttpStatus.CONFLICT,
          'COUPLE_FULL',
          'Couple space is full',
        );
      }
    });

    const updated = await this.prisma.couple.findUnique({
      where: { id: coupleByCode.id },
      include: {
        creator: true,
        partner: true,
      },
    });

    if (!updated) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'NOT_FOUND',
        'Couple not found',
      );
    }

    return this.mapCouple(updated);
  }

  async getById(
    coupleId: string,
    actorUserId: string,
  ): Promise<{
    id: string;
    pairCode: string;
    creatorId: string;
    partnerId: string | null;
    anniversaryDate: string | null;
    intimacyScore: number;
    users: Array<{ id: string; name: string; avatarUrl: string | null }>;
  }> {
    await this.assertMember(coupleId, actorUserId);

    const couple = await this.prisma.couple.findUnique({
      where: { id: coupleId },
      include: {
        creator: true,
        partner: true,
      },
    });

    if (!couple) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'NOT_FOUND',
        'Couple not found',
      );
    }

    return this.mapCouple(couple);
  }

  async update(
    coupleId: string,
    actorUserId: string,
    dto: UpdateCoupleDto,
  ): Promise<{
    id: string;
    pairCode: string;
    creatorId: string;
    partnerId: string | null;
    anniversaryDate: string | null;
    intimacyScore: number;
    users: Array<{ id: string; name: string; avatarUrl: string | null }>;
  }> {
    await this.assertMember(coupleId, actorUserId);

    const updated = await this.prisma.couple.update({
      where: { id: coupleId },
      data: {
        anniversaryDate: dto.anniversaryDate
          ? new Date(dto.anniversaryDate)
          : undefined,
        intimacyScore: dto.intimacyScore,
      },
      include: {
        creator: true,
        partner: true,
      },
    });

    return this.mapCouple(updated);
  }
}
