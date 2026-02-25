import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Alice (Updated)' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  name?: string;

  @ApiPropertyOptional({
    example: 'https://foever-love.chuhaibox.com/api/v1/media/object/xxxx',
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  avatarUrl?: string;
}
