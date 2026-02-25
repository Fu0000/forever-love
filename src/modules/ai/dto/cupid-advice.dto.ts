import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CupidAdviceDto {
  @ApiProperty({ example: '我们最近总是吵架，怎么办？' })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  query!: string;
}

