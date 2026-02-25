import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CupidDateIdeasDto {
  @ApiProperty({ example: '喜欢猫、咖啡、摄影、看展' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  interests!: string;
}

