import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreatePairRequestDto } from './dto/create-pair-request.dto';
import { PairRequestsService } from './pair-requests.service';

@ApiTags('Couples')
@ApiBearerAuth()
@Controller('couples/requests')
export class PairRequestsController {
  constructor(private readonly pairRequestsService: PairRequestsService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePairRequestDto,
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
    return this.pairRequestsService.create(user.userId, dto.targetClientUserId);
  }

  @Get('incoming')
  incoming(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
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
    return this.pairRequestsService.listIncoming(user.userId, status);
  }

  @Get('outgoing')
  outgoing(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
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
    return this.pairRequestsService.listOutgoing(user.userId, status);
  }

  @Post(':requestId/accept')
  @HttpCode(HttpStatus.OK)
  accept(
    @CurrentUser() user: AuthenticatedUser,
    @Param('requestId') requestId: string,
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
    return this.pairRequestsService.accept(user.userId, requestId);
  }

  @Post(':requestId/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('requestId') requestId: string,
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
    return this.pairRequestsService.reject(user.userId, requestId);
  }

  @Post(':requestId/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('requestId') requestId: string,
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
    return this.pairRequestsService.cancel(user.userId, requestId);
  }
}
