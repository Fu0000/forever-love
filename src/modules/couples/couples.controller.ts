import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { Response } from 'express';
import { CouplesService } from './couples.service';
import { JoinCoupleDto } from './dto/join-couple.dto';
import { UpdateCoupleDto } from './dto/update-couple.dto';

@ApiTags('Couples')
@ApiBearerAuth()
@Controller('couples')
export class CouplesController {
  constructor(private readonly couplesService: CouplesService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{
    id: string;
    pairCode: string;
    creatorId: string;
    partnerId: string | null;
    anniversaryDate: string | null;
    intimacyScore: number;
    users: Array<{ id: string; name: string; avatarUrl: string | null }>;
  }> {
    const created = await this.couplesService.create(user.userId);
    response.status(HttpStatus.CREATED);
    response.setHeader('Location', `/api/v1/couples/${created.id}`);
    return created;
  }

  @Post('join')
  @HttpCode(HttpStatus.OK)
  join(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: JoinCoupleDto,
  ): Promise<{
    id: string;
    pairCode: string;
    creatorId: string;
    partnerId: string | null;
    anniversaryDate: string | null;
    intimacyScore: number;
    users: Array<{ id: string; name: string; avatarUrl: string | null }>;
  }> {
    return this.couplesService.join(user.userId, dto.pairCode);
  }

  @Get(':coupleId')
  getById(
    @Param('coupleId') coupleId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{
    id: string;
    pairCode: string;
    creatorId: string;
    partnerId: string | null;
    anniversaryDate: string | null;
    intimacyScore: number;
    users: Array<{ id: string; name: string; avatarUrl: string | null }>;
  }> {
    return this.couplesService.getById(coupleId, user.userId);
  }

  @Patch(':coupleId')
  update(
    @Param('coupleId') coupleId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateCoupleDto,
  ): Promise<{
    id: string;
    pairCode: string;
    creatorId: string;
    partnerId: string | null;
    anniversaryDate: string | null;
    intimacyScore: number;
    users: Array<{ id: string; name: string; avatarUrl: string | null }>;
  }> {
    return this.couplesService.update(coupleId, user.userId, dto);
  }

  @Post(':coupleId/dissolve')
  @HttpCode(HttpStatus.OK)
  dissolve(
    @Param('coupleId') coupleId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{
    id: string;
    pairCode: string;
    creatorId: string;
    partnerId: string | null;
    anniversaryDate: string | null;
    intimacyScore: number;
    users: Array<{ id: string; name: string; avatarUrl: string | null }>;
  }> {
    return this.couplesService.dissolve(coupleId, user.userId);
  }
}
