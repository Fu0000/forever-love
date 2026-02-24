import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<{
    id: string;
    name: string;
    avatarUrl: string | null;
  }> {
    return this.usersService.getById(user.userId);
  }

  @Get(':userId')
  getById(@Param('userId') userId: string): Promise<{
    id: string;
    name: string;
    avatarUrl: string | null;
  }> {
    return this.usersService.getById(userId);
  }

  @Patch(':userId')
  update(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserDto,
  ): Promise<{
    id: string;
    name: string;
    avatarUrl: string | null;
  }> {
    return this.usersService.update(userId, user.userId, dto);
  }
}
