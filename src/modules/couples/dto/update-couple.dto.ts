import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateCoupleDto {
  @IsOptional()
  @IsDateString()
  anniversaryDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  intimacyScore?: number;
}
