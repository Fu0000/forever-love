import {
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiPropertyOptional({
    description: 'Client-generated stable user id (idempotent login)',
    example: 'user_123456789',
  })
  @IsOptional()
  @IsString()
  @Matches(/^user_[A-Za-z0-9_-]{6,64}$/)
  clientUserId?: string;

  @ApiProperty({ example: 'Alice' })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  name!: string;

  @ApiPropertyOptional({
    description: 'Avatar URL (optional)',
    example: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Alice',
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  avatarUrl?: string;
}
