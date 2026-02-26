import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../../common/errors/app.exception';
import { generateEntityId, generatePairCode } from '../../common/utils/id';
import { Prisma } from '@prisma/client';
import { UpdateCoupleDto } from './dto/update-couple.dto';
import { toDateOnlyString } from '../../common/utils/date';
import { IntimacyService } from '../intimacy/intimacy.service';
import { IntimacyEventType } from '@prisma/client';

type CoupleWithUsers = Prisma.CoupleGetPayload<{
  include: {
    creator: true;
    partner: true;
  };
}>;

@Injectable()
export class CouplesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly intimacyService: IntimacyService,
  ) {}

  async ensureUserCouplePointers(userId: string): Promise<{
    homeCoupleId: string | null;
    activeCoupleId: string | null;
    coupleId: string | null;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { homeCoupleId: true, activeCoupleId: true },
    });

    if (!user) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'NOT_FOUND',
        'User not found',
      );
    }

    let homeCoupleId = user.homeCoupleId ?? null;
    let activeCoupleId = user.activeCoupleId ?? null;
    let shouldUpdate = false;

    if (!homeCoupleId) {
      const creatorCouple = await this.prisma.couple.findUnique({
        where: { creatorId: userId },
        select: { id: true },
      });
      if (creatorCouple) {
        homeCoupleId = creatorCouple.id;
        shouldUpdate = true;
      }
    }

    if (!activeCoupleId) {
      const partnerCouple = await this.prisma.couple.findFirst({
        where: { partnerId: userId },
        select: { id: true },
      });
      if (partnerCouple) {
        activeCoupleId = partnerCouple.id;
        shouldUpdate = true;
      } else if (homeCoupleId) {
        activeCoupleId = homeCoupleId;
        shouldUpdate = true;
      }
    }

    if (shouldUpdate) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          homeCoupleId,
          activeCoupleId,
        },
        select: { id: true },
      });
    }

    const coupleId = activeCoupleId ?? homeCoupleId ?? null;

    return {
      homeCoupleId,
      activeCoupleId,
      coupleId,
    };
  }

  async ensureHomeCouple(userId: string): Promise<string> {
    const state = await this.ensureUserCouplePointers(userId);
    if (state.homeCoupleId) {
      return state.homeCoupleId;
    }

    const existing = await this.prisma.couple.findUnique({
      where: { creatorId: userId },
      select: { id: true },
    });
    if (existing) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          homeCoupleId: existing.id,
          activeCoupleId: state.activeCoupleId ?? existing.id,
        },
      });
      return existing.id;
    }

    for (let index = 0; index < 8; index += 1) {
      try {
        const couple = await this.prisma.couple.create({
          data: {
            id: generateEntityId('cpl_'),
            pairCode: generatePairCode(),
            creatorId: userId,
          },
          select: { id: true },
        });

        await this.prisma.user.update({
          where: { id: userId },
          data: {
            homeCoupleId: couple.id,
            activeCoupleId: state.activeCoupleId ?? couple.id,
          },
        });

        return couple.id;
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

  async setActiveCouple(userId: string, coupleId: string | null): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { activeCoupleId: coupleId },
    });
  }

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
    const homeCoupleId = await this.ensureHomeCouple(userId);

    const couple = await this.prisma.couple.findUnique({
      where: { id: homeCoupleId },
      include: { creator: true, partner: true },
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

    const creatorAlreadyPartner = await this.prisma.couple.findFirst({
      where: { partnerId: coupleByCode.creatorId },
      select: { id: true },
    });
    if (creatorAlreadyPartner) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'COUPLE_CREATOR_ALREADY_PAIRED',
        'Couple creator already paired',
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

    const state = await this.ensureUserCouplePointers(userId);

    if (state.activeCoupleId) {
      if (state.homeCoupleId && state.activeCoupleId !== state.homeCoupleId) {
        throw new AppException(
          HttpStatus.CONFLICT,
          'ALREADY_JOINED',
          'User already joined another couple',
        );
      }

      const active = await this.prisma.couple.findUnique({
        where: { id: state.activeCoupleId },
        select: { partnerId: true },
      });
      if (active?.partnerId) {
        throw new AppException(
          HttpStatus.CONFLICT,
          'ALREADY_JOINED',
          'User already paired in a couple',
        );
      }
    }

    await this.ensureHomeCouple(userId);

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

    await this.setActiveCouple(userId, coupleByCode.id);

    await this.intimacyService.award(
      coupleByCode.id,
      userId,
      IntimacyEventType.PAIR_SUCCESS,
      {
        dedupeKey: `pair:success:${coupleByCode.id}`,
        meta: { method: 'pair_code_join' },
      },
    );

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

    const updated = await this.prisma.$transaction(async (tx) => {
      const before = await tx.couple.findUnique({
        where: { id: coupleId },
        select: { anniversaryDate: true },
      });

      const row = await tx.couple.update({
        where: { id: coupleId },
        data: {
          anniversaryDate: dto.anniversaryDate
            ? new Date(dto.anniversaryDate)
            : undefined,
        },
        include: {
          creator: true,
          partner: true,
        },
      });

      if (!before?.anniversaryDate && dto.anniversaryDate) {
        await this.intimacyService.award(
          coupleId,
          actorUserId,
          IntimacyEventType.ANNIVERSARY_SET,
          {
            dedupeKey: `anniversary:set:${coupleId}`,
            meta: { anniversaryDate: dto.anniversaryDate },
            tx,
          },
        );
      }

      return row;
    });

    return this.mapCouple(updated);
  }

  async dissolve(
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

    const dissolved = await this.prisma.$transaction(async (tx) => {
      const couple = await tx.couple.findUnique({
        where: { id: coupleId },
        select: { id: true, creatorId: true, partnerId: true },
      });
      if (!couple) {
        throw new AppException(
          HttpStatus.NOT_FOUND,
          'NOT_FOUND',
          'Couple not found',
        );
      }

      if (!couple.partnerId) {
        return couple.id;
      }

      await tx.couple.update({
        where: { id: coupleId },
        data: { partnerId: null },
        select: { id: true },
      });

      const creator = await tx.user.findUnique({
        where: { id: couple.creatorId },
        select: { homeCoupleId: true },
      });
      const partner = await tx.user.findUnique({
        where: { id: couple.partnerId },
        select: { homeCoupleId: true },
      });

      const creatorHome =
        creator?.homeCoupleId ??
        (
          await tx.couple.findUnique({
            where: { creatorId: couple.creatorId },
            select: { id: true },
          })
        )?.id ??
        null;
      const partnerHome =
        partner?.homeCoupleId ??
        (
          await tx.couple.findUnique({
            where: { creatorId: couple.partnerId },
            select: { id: true },
          })
        )?.id ??
        null;

      await tx.user.update({
        where: { id: couple.creatorId },
        data: {
          homeCoupleId: creator?.homeCoupleId ?? creatorHome,
          activeCoupleId: creatorHome,
        },
      });
      await tx.user.update({
        where: { id: couple.partnerId },
        data: {
          homeCoupleId: partner?.homeCoupleId ?? partnerHome,
          activeCoupleId: partnerHome,
        },
      });

      return couple.id;
    });

    const updated = await this.prisma.couple.findUnique({
      where: { id: dissolved },
      include: { creator: true, partner: true },
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
}
