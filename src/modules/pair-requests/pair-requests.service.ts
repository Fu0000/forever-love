import { HttpStatus, Injectable } from '@nestjs/common';
import { PairRequestStatus, Prisma } from '@prisma/client';
import { AppException } from '../../common/errors/app.exception';
import { generateEntityId, generatePairCode } from '../../common/utils/id';
import { CouplesService } from '../couples/couples.service';
import { PrismaService } from '../prisma/prisma.service';

type PairRequestWithUsers = Prisma.PairRequestGetPayload<{
  include: {
    fromUser: true;
    toUser: true;
  };
}>;

const parseStatusFilter = (status?: string): PairRequestStatus[] | undefined => {
  if (!status) return [PairRequestStatus.PENDING];
  const normalized = status.toLowerCase();
  if (normalized === 'all') return undefined;
  if (normalized === 'pending') return [PairRequestStatus.PENDING];
  if (normalized === 'accepted') return [PairRequestStatus.ACCEPTED];
  if (normalized === 'rejected') return [PairRequestStatus.REJECTED];
  if (normalized === 'canceled' || normalized === 'cancelled') {
    return [PairRequestStatus.CANCELED];
  }
  return [PairRequestStatus.PENDING];
};

@Injectable()
export class PairRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couplesService: CouplesService,
  ) {}

  private resolveTargetWhere(
    targetClientUserId: string,
  ): Prisma.UserWhereUniqueInput {
    if (/^usr_[a-f0-9]{20}$/.test(targetClientUserId)) {
      return { id: targetClientUserId };
    }
    return { clientUserId: targetClientUserId };
  }

  private mapRequest(request: PairRequestWithUsers): {
    id: string;
    coupleId: string;
    fromUserId: string;
    toUserId: string;
    status: string;
    createdAt: string;
    respondedAt: string | null;
  } {
    return {
      id: request.id,
      coupleId: request.coupleId,
      fromUserId: request.fromUserId,
      toUserId: request.toUserId,
      status: request.status,
      createdAt: request.createdAt.toISOString(),
      respondedAt: request.respondedAt ? request.respondedAt.toISOString() : null,
    };
  }

  private async createCoupleForUser(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<{ id: string }> {
    for (let index = 0; index < 8; index += 1) {
      try {
        const couple = await tx.couple.create({
          data: {
            id: generateEntityId('cpl_'),
            pairCode: generatePairCode(),
            creatorId: userId,
          },
          select: { id: true },
        });
        return couple;
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

  async create(
    actorUserId: string,
    targetClientUserId: string,
  ): Promise<{
    request: {
      id: string;
      coupleId: string;
      fromUserId: string;
      toUserId: string;
      status: string;
      createdAt: string;
      respondedAt: string | null;
    };
    couple: unknown;
  }> {
    const result = await this.prisma.$transaction(async (tx) => {
      const targetUser = await tx.user.findUnique({
        where: this.resolveTargetWhere(targetClientUserId),
        select: { id: true },
      });
      if (!targetUser) {
        throw new AppException(
          HttpStatus.NOT_FOUND,
          'TARGET_NOT_FOUND',
          'Target user not found',
        );
      }
      if (targetUser.id === actorUserId) {
        throw new AppException(
          HttpStatus.BAD_REQUEST,
          'CANNOT_PAIR_SELF',
          'Cannot send pair request to yourself',
        );
      }

      const actorCouple = await tx.couple.findFirst({
        where: { OR: [{ creatorId: actorUserId }, { partnerId: actorUserId }] },
        select: { id: true, creatorId: true, partnerId: true },
      });
      if (actorCouple?.partnerId) {
        throw new AppException(
          HttpStatus.CONFLICT,
          'ALREADY_PAIRED',
          'User already paired',
        );
      }

      const targetCouple = await tx.couple.findFirst({
        where: {
          OR: [{ creatorId: targetUser.id }, { partnerId: targetUser.id }],
        },
        select: { id: true },
      });
      if (targetCouple) {
        throw new AppException(
          HttpStatus.CONFLICT,
          'TARGET_ALREADY_PAIRED',
          'Target user already belongs to a couple',
        );
      }

      const existingPending = await tx.pairRequest.findFirst({
        where: {
          status: PairRequestStatus.PENDING,
          OR: [
            { fromUserId: actorUserId },
            { toUserId: actorUserId },
            { fromUserId: targetUser.id },
            { toUserId: targetUser.id },
          ],
        },
        select: { id: true },
      });
      if (existingPending) {
        throw new AppException(
          HttpStatus.CONFLICT,
          'PAIR_REQUEST_EXISTS',
          'A pending pair request already exists',
        );
      }

      const coupleId =
        actorCouple?.id ?? (await this.createCoupleForUser(tx, actorUserId)).id;

      const request = await tx.pairRequest.create({
        data: {
          id: generateEntityId('req_'),
          coupleId,
          fromUserId: actorUserId,
          toUserId: targetUser.id,
          status: PairRequestStatus.PENDING,
        },
        include: {
          fromUser: true,
          toUser: true,
        },
      });

      return {
        request,
        coupleId,
      };
    });

    const couple = await this.couplesService.getById(result.coupleId, actorUserId);
    return {
      request: this.mapRequest(result.request),
      couple,
    };
  }

  async listIncoming(
    actorUserId: string,
    status?: string,
  ): Promise<
    Array<{
      id: string;
      coupleId: string;
      status: string;
      createdAt: string;
      respondedAt: string | null;
      fromUser: {
        id: string;
        clientUserId: string | null;
        name: string;
        avatarUrl: string | null;
      };
    }>
  > {
    const statuses = parseStatusFilter(status);

    const requests = await this.prisma.pairRequest.findMany({
      where: {
        toUserId: actorUserId,
        ...(statuses ? { status: { in: statuses } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: true,
      },
      take: 20,
    });

    return requests.map((request) => ({
        id: request.id,
        coupleId: request.coupleId,
        status: request.status,
        createdAt: request.createdAt.toISOString(),
        respondedAt: request.respondedAt ? request.respondedAt.toISOString() : null,
        fromUser: {
          id: request.fromUser.id,
          clientUserId: request.fromUser.clientUserId ?? null,
          name: request.fromUser.name,
          avatarUrl: request.fromUser.avatarUrl,
        },
      }));
  }

  async listOutgoing(
    actorUserId: string,
    status?: string,
  ): Promise<
    Array<{
      id: string;
      coupleId: string;
      status: string;
      createdAt: string;
      respondedAt: string | null;
      toUser: {
        id: string;
        clientUserId: string | null;
        name: string;
        avatarUrl: string | null;
      };
    }>
  > {
    const statuses = parseStatusFilter(status);

    const requests = await this.prisma.pairRequest.findMany({
      where: {
        fromUserId: actorUserId,
        ...(statuses ? { status: { in: statuses } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        toUser: true,
      },
      take: 20,
    });

    return requests.map((request) => ({
        id: request.id,
        coupleId: request.coupleId,
        status: request.status,
        createdAt: request.createdAt.toISOString(),
        respondedAt: request.respondedAt ? request.respondedAt.toISOString() : null,
        toUser: {
          id: request.toUser.id,
          clientUserId: request.toUser.clientUserId ?? null,
          name: request.toUser.name,
          avatarUrl: request.toUser.avatarUrl,
        },
      }));
  }

  async accept(
    actorUserId: string,
    requestId: string,
  ): Promise<{
    request: {
      id: string;
      coupleId: string;
      fromUserId: string;
      toUserId: string;
      status: string;
      createdAt: string;
      respondedAt: string | null;
    };
    couple: unknown;
  }> {
    const request = await this.prisma.$transaction(async (tx) => {
      const requestRecord = await tx.pairRequest.findUnique({
        where: { id: requestId },
        include: { fromUser: true, toUser: true },
      });
      if (!requestRecord) {
        throw new AppException(
          HttpStatus.NOT_FOUND,
          'REQUEST_NOT_FOUND',
          'Pair request not found',
        );
      }
      if (requestRecord.toUserId !== actorUserId) {
        throw new AppException(
          HttpStatus.FORBIDDEN,
          'FORBIDDEN',
          'Cannot accept this request',
        );
      }
      if (requestRecord.status !== PairRequestStatus.PENDING) {
        throw new AppException(
          HttpStatus.CONFLICT,
          'REQUEST_NOT_PENDING',
          'Pair request is not pending',
        );
      }

      const actorCouple = await tx.couple.findFirst({
        where: { OR: [{ creatorId: actorUserId }, { partnerId: actorUserId }] },
        select: { id: true },
      });
      if (actorCouple) {
        throw new AppException(
          HttpStatus.CONFLICT,
          'ALREADY_PAIRED',
          'User already belongs to a couple',
        );
      }

      const couple = await tx.couple.findUnique({
        where: { id: requestRecord.coupleId },
        select: { creatorId: true, partnerId: true },
      });
      if (!couple) {
        throw new AppException(
          HttpStatus.NOT_FOUND,
          'NOT_FOUND',
          'Couple not found',
        );
      }
      if (couple.creatorId !== requestRecord.fromUserId) {
        throw new AppException(
          HttpStatus.CONFLICT,
          'REQUEST_INVALID',
          'Pair request couple mismatch',
        );
      }

      const updateResult = await tx.couple.updateMany({
        where: {
          id: requestRecord.coupleId,
          partnerId: null,
        },
        data: {
          partnerId: actorUserId,
        },
      });
      if (updateResult.count === 0) {
        throw new AppException(
          HttpStatus.CONFLICT,
          'COUPLE_FULL',
          'Couple space is full',
        );
      }

      const now = new Date();

      const accepted = await tx.pairRequest.update({
        where: { id: requestId },
        data: { status: PairRequestStatus.ACCEPTED, respondedAt: now },
        include: { fromUser: true, toUser: true },
      });

      await tx.pairRequest.updateMany({
        where: {
          status: PairRequestStatus.PENDING,
          id: { not: requestId },
          OR: [
            { fromUserId: accepted.fromUserId },
            { toUserId: accepted.fromUserId },
            { fromUserId: accepted.toUserId },
            { toUserId: accepted.toUserId },
          ],
        },
        data: {
          status: PairRequestStatus.CANCELED,
          respondedAt: now,
        },
      });

      return accepted;
    });

    const couple = await this.couplesService.getById(request.coupleId, actorUserId);
    return {
      request: this.mapRequest(request),
      couple,
    };
  }

  async reject(
    actorUserId: string,
    requestId: string,
  ): Promise<{
    request: {
      id: string;
      coupleId: string;
      fromUserId: string;
      toUserId: string;
      status: string;
      createdAt: string;
      respondedAt: string | null;
    };
  }> {
    const request = await this.prisma.pairRequest.findUnique({
      where: { id: requestId },
      include: { fromUser: true, toUser: true },
    });
    if (!request) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'REQUEST_NOT_FOUND',
        'Pair request not found',
      );
    }
    if (request.toUserId !== actorUserId) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        'FORBIDDEN',
        'Cannot reject this request',
      );
    }
    if (request.status !== PairRequestStatus.PENDING) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'REQUEST_NOT_PENDING',
        'Pair request is not pending',
      );
    }

    const updated = await this.prisma.pairRequest.update({
      where: { id: requestId },
      data: { status: PairRequestStatus.REJECTED, respondedAt: new Date() },
      include: { fromUser: true, toUser: true },
    });

    return {
      request: this.mapRequest(updated),
    };
  }

  async cancel(
    actorUserId: string,
    requestId: string,
  ): Promise<{
    request: {
      id: string;
      coupleId: string;
      fromUserId: string;
      toUserId: string;
      status: string;
      createdAt: string;
      respondedAt: string | null;
    };
  }> {
    const request = await this.prisma.pairRequest.findUnique({
      where: { id: requestId },
      include: { fromUser: true, toUser: true },
    });
    if (!request) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'REQUEST_NOT_FOUND',
        'Pair request not found',
      );
    }
    if (request.fromUserId !== actorUserId) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        'FORBIDDEN',
        'Cannot cancel this request',
      );
    }
    if (request.status !== PairRequestStatus.PENDING) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'REQUEST_NOT_PENDING',
        'Pair request is not pending',
      );
    }

    const updated = await this.prisma.pairRequest.update({
      where: { id: requestId },
      data: { status: PairRequestStatus.CANCELED, respondedAt: new Date() },
      include: { fromUser: true, toUser: true },
    });

    return {
      request: this.mapRequest(updated),
    };
  }
}
