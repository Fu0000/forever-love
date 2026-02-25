import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePairRequestDto {
  @ApiProperty({
    description: 'Target clientUserId (user_...) or user id (usr_...)',
    example: 'user_123456789',
  })
  @IsString()
  @Matches(/^(user_[A-Za-z0-9_-]{6,64}|usr_[a-f0-9]{20})$/)
  targetClientUserId!: string;
}
