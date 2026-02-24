import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { generateEntityId } from '../../common/utils/id';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<{
    user: { id: string; name: string; avatarUrl: string | null };
    token: string;
  }> {
    const defaultAvatarUrl = this.configService.get<string>('defaultAvatarUrl');

    let user = dto.clientUserId
      ? await this.prisma.user.findUnique({
          where: { clientUserId: dto.clientUserId },
        })
      : null;

    if (user) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          name: dto.name,
          avatarUrl: dto.avatarUrl ?? user.avatarUrl ?? defaultAvatarUrl,
        },
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          id: generateEntityId('usr_'),
          clientUserId: dto.clientUserId,
          name: dto.name,
          avatarUrl: dto.avatarUrl ?? defaultAvatarUrl,
        },
      });
    }

    const token = await this.jwtService.signAsync({
      sub: user.id,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      token,
    };
  }
}
