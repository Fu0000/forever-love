import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../../common/errors/app.exception';
import { UpdateUserDto } from './dto/update-user.dto';
import { CouplesService } from '../couples/couples.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couplesService: CouplesService,
  ) {}

  async getMe(userId: string): Promise<{
    id: string;
    clientUserId: string | null;
    name: string;
    avatarUrl: string | null;
    homeCoupleId: string | null;
    activeCoupleId: string | null;
    coupleId: string | null;
  }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'NOT_FOUND',
        'User not found',
      );
    }

    const state = await this.couplesService.ensureUserCouplePointers(userId);

    return {
      id: user.id,
      clientUserId: user.clientUserId ?? null,
      name: user.name,
      avatarUrl: user.avatarUrl,
      homeCoupleId: state.homeCoupleId,
      activeCoupleId: state.activeCoupleId,
      coupleId: state.coupleId,
    };
  }

  async getById(userId: string): Promise<{
    id: string;
    clientUserId: string | null;
    name: string;
    avatarUrl: string | null;
  }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'NOT_FOUND',
        'User not found',
      );
    }

    return {
      id: user.id,
      clientUserId: user.clientUserId ?? null,
      name: user.name,
      avatarUrl: user.avatarUrl,
    };
  }

  async update(
    targetUserId: string,
    actorUserId: string,
    dto: UpdateUserDto,
  ): Promise<{
    id: string;
    clientUserId: string | null;
    name: string;
    avatarUrl: string | null;
  }> {
    if (targetUserId !== actorUserId) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        'FORBIDDEN',
        'Cannot update another user profile',
      );
    }

    const existing = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!existing) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'NOT_FOUND',
        'User not found',
      );
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        name: dto.name,
        avatarUrl: dto.avatarUrl,
      },
    });

    return {
      id: updated.id,
      clientUserId: updated.clientUserId ?? null,
      name: updated.name,
      avatarUrl: updated.avatarUrl,
    };
  }
}
