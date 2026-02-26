import { IsIn, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SurpriseClickDto {
  @ApiProperty({ example: 'evt_abc123' })
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{6,64}$/)
  clientEventId!: string;

  @ApiProperty({ example: 'gift', enum: ['gift', 'cat', 'dog', 'balloon'] })
  @IsString()
  @IsIn(['gift', 'cat', 'dog', 'balloon'])
  type!: 'gift' | 'cat' | 'dog' | 'balloon';
}

