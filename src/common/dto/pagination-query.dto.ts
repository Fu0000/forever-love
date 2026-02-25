import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100, example: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit = 20;

  @ApiPropertyOptional({ example: 'eyJjcmVhdGVkQXQiOiIyMDI2LTAyLTI0VDEwOjMwOjAwWiIsImlkIjoibm90ZV94eCJ9' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ default: '-createdAt', example: '-createdAt' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? String(value) : '-createdAt'))
  sort = '-createdAt';
}
