import { IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinCoupleDto {
  @ApiProperty({ example: 'A1B2C3' })
  @IsString()
  @Length(6, 6)
  @Matches(/^[A-Za-z0-9]{6}$/)
  pairCode!: string;
}
