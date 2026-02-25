import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CupidLoveNoteDto {
  @ApiProperty({ example: '浪漫且调皮' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  mood!: string;

  @ApiProperty({ example: 'Alice' })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  partnerName!: string;
}

